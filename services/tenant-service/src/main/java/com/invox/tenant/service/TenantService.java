package com.invox.tenant.service;

import com.invox.tenant.asgardeo.AsgardeoClient;
import com.invox.tenant.asgardeo.dto.AsgardeoOrgResponse;
import com.invox.tenant.dto.*;
import com.invox.tenant.entity.Tenant;
import com.invox.tenant.entity.TenantStatus;
import com.invox.tenant.entity.TenantUser;
import com.invox.tenant.entity.UserRole;
import com.invox.tenant.multitenancy.TenantContext;
import com.invox.tenant.repository.TenantRepository;
import com.invox.tenant.repository.TenantUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final TenantUserRepository tenantUserRepository;
    private final AsgardeoClient asgardeoClient;

    /**
     * Self-service Tenant registration flow (B2B Organization creation)
     */
    @Transactional
    public TenantResponse registerTenant(TenantRegisterRequest request) {
        String cleanSubdomain = request.getSubdomain().toLowerCase().trim();

        if (tenantRepository.existsBySubdomainIgnoreCase(cleanSubdomain)) {
            throw new IllegalArgumentException("Subdomain '" + cleanSubdomain + "' is already in use.");
        }

        if (tenantRepository.existsByAdminEmailIgnoreCase(request.getAdminEmail())) {
            throw new IllegalArgumentException("Admin email '" + request.getAdminEmail() + "' is already registered.");
        }

        log.info("Starting B2B tenant registration for company: '{}' ({})", request.getCompanyName(), cleanSubdomain);

        // 1. Provision Sub-Organization in Asgardeo
        AsgardeoOrgResponse orgResponse = asgardeoClient.createSubOrganization(
                request.getCompanyName(),
                cleanSubdomain
        );

        String asgardeoOrgId = orgResponse.getId();
        log.info("Asgardeo Sub-Organization created successfully with Org ID: {}", asgardeoOrgId);

        // 2. Share SPA application with this new sub-organization
        asgardeoClient.shareAppWithSubOrg(asgardeoOrgId);

        // 3. Provision Initial Administrator User in the Sub-Organization
        String asgardeoUserId = asgardeoClient.createAdminUserInSubOrg(
                asgardeoOrgId,
                request.getAdminEmail(),
                request.getAdminFirstName(),
                request.getAdminLastName(),
                request.getAdminPassword()
        );

        // 4. Save Tenant entity in PostgreSQL
        Tenant tenant = Tenant.builder()
                .companyName(request.getCompanyName())
                .subdomain(cleanSubdomain)
                .asgardeoOrgId(asgardeoOrgId)
                .asgardeoOrgHandle(cleanSubdomain)
                .status(TenantStatus.ACTIVE)
                .adminEmail(request.getAdminEmail())
                .plan("FREE_TIER")
                .build();

        tenant = tenantRepository.save(tenant);

        // 5. Save Admin user record
        TenantUser adminUser = TenantUser.builder()
                .tenant(tenant)
                .email(request.getAdminEmail())
                .firstName(request.getAdminFirstName())
                .lastName(request.getAdminLastName())
                .asgardeoUserId(asgardeoUserId)
                .role(UserRole.ADMINISTRATOR)
                .active(true)
                .build();

        tenantUserRepository.save(adminUser);

        log.info("Tenant '{}' registered successfully with ID {}", tenant.getCompanyName(), tenant.getId());

        String loginUrl = String.format("http://localhost:5173/login?org=%s", cleanSubdomain);

        return TenantResponse.builder()
                .id(tenant.getId())
                .companyName(tenant.getCompanyName())
                .subdomain(tenant.getSubdomain())
                .asgardeoOrgId(tenant.getAsgardeoOrgId())
                .asgardeoOrgHandle(tenant.getAsgardeoOrgHandle())
                .status(tenant.getStatus())
                .plan(tenant.getPlan())
                .adminEmail(tenant.getAdminEmail())
                .loginUrl(loginUrl)
                .createdAt(tenant.getCreatedAt())
                .build();
    }

    /**
     * Invites an employee/user to the current tenant's sub-organization
     */
    @Transactional
    public TenantUserDto inviteEmployee(UserInviteRequest request) {
        Tenant tenant = resolveCurrentTenant();

        if (tenantUserRepository.existsByTenantAndEmailIgnoreCase(tenant, request.getEmail())) {
            throw new IllegalArgumentException("User with email '" + request.getEmail() + "' is already part of this organization.");
        }

        // 1. Send invite / provision user in Asgardeo Sub-Organization
        asgardeoClient.inviteEmployeeToSubOrg(
                tenant.getAsgardeoOrgId(),
                request.getEmail(),
                request.getRole().name()
        );

        // 2. Save in database
        TenantUser user = TenantUser.builder()
                .tenant(tenant)
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .active(true)
                .build();

        user = tenantUserRepository.save(user);

        return toUserDto(user);
    }

    /**
     * Gets all users belonging to the current tenant
     */
    @Transactional(readOnly = true)
    public List<TenantUserDto> getTenantUsers() {
        Tenant tenant = resolveCurrentTenant();
        return tenantUserRepository.findByTenant(tenant)
                .stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
    }

    /**
     * Gets profile details of the current tenant
     */
    @Transactional(readOnly = true)
    public TenantResponse getCurrentTenant() {
        Tenant tenant = resolveCurrentTenant();
        return TenantResponse.builder()
                .id(tenant.getId())
                .companyName(tenant.getCompanyName())
                .subdomain(tenant.getSubdomain())
                .asgardeoOrgId(tenant.getAsgardeoOrgId())
                .asgardeoOrgHandle(tenant.getAsgardeoOrgHandle())
                .status(tenant.getStatus())
                .plan(tenant.getPlan())
                .adminEmail(tenant.getAdminEmail())
                .createdAt(tenant.getCreatedAt())
                .build();
    }

    /**
     * Public helper to list tenants for local testbed
     */
    @Transactional(readOnly = true)
    public List<TenantResponse> getAllTenants() {
        return tenantRepository.findAll().stream()
                .map(t -> TenantResponse.builder()
                        .id(t.getId())
                        .companyName(t.getCompanyName())
                        .subdomain(t.getSubdomain())
                        .asgardeoOrgId(t.getAsgardeoOrgId())
                        .asgardeoOrgHandle(t.getAsgardeoOrgHandle())
                        .status(t.getStatus())
                        .plan(t.getPlan())
                        .adminEmail(t.getAdminEmail())
                        .createdAt(t.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Updates user role and profile details in the current tenant
     */
    @Transactional
    public TenantUserDto updateUser(java.util.UUID userId, UserUpdateRequest request) {
        Tenant tenant = resolveCurrentTenant();
        TenantUser user = tenantUserRepository.findByIdAndTenant(userId, tenant)
                .orElseThrow(() -> new IllegalArgumentException("User not found in this organization: " + userId));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        user = tenantUserRepository.save(user);
        log.info("Updated user '{}' in tenant '{}'", user.getEmail(), tenant.getCompanyName());
        return toUserDto(user);
    }

    /**
     * Toggles active / suspended status of an organization user
     */
    @Transactional
    public TenantUserDto toggleUserStatus(java.util.UUID userId, boolean active) {
        Tenant tenant = resolveCurrentTenant();
        TenantUser user = tenantUserRepository.findByIdAndTenant(userId, tenant)
                .orElseThrow(() -> new IllegalArgumentException("User not found in this organization: " + userId));

        user.setActive(active);
        user = tenantUserRepository.save(user);
        log.info("Toggled user '{}' active status to {} in tenant '{}'", user.getEmail(), active, tenant.getCompanyName());
        return toUserDto(user);
    }

    /**
     * Removes an employee from the current tenant organization
     */
    @Transactional
    public void removeUser(java.util.UUID userId) {
        Tenant tenant = resolveCurrentTenant();
        TenantUser user = tenantUserRepository.findByIdAndTenant(userId, tenant)
                .orElseThrow(() -> new IllegalArgumentException("User not found in this organization: " + userId));

        tenantUserRepository.delete(user);
        log.info("Removed user '{}' from tenant '{}'", user.getEmail(), tenant.getCompanyName());
    }

    /**
     * Public helper to resolve tenant by subdomain or orgId
     */
    @Transactional(readOnly = true)
    public TenantResponse getTenantBySubdomain(String subdomain) {
        Tenant tenant = tenantRepository.findBySubdomainIgnoreCase(subdomain.trim())
                .orElseThrow(() -> new IllegalArgumentException("Tenant organization not found for subdomain: " + subdomain));

        return TenantResponse.builder()
                .id(tenant.getId())
                .companyName(tenant.getCompanyName())
                .subdomain(tenant.getSubdomain())
                .asgardeoOrgId(tenant.getAsgardeoOrgId())
                .asgardeoOrgHandle(tenant.getAsgardeoOrgHandle())
                .status(tenant.getStatus())
                .plan(tenant.getPlan())
                .adminEmail(tenant.getAdminEmail())
                .createdAt(tenant.getCreatedAt())
                .build();
    }

    /**
     * Deletes a tenant from Asgardeo and Database
     */
    @Transactional
    public void deleteTenant(java.util.UUID tenantId) {
        tenantRepository.findById(tenantId).ifPresent(t -> {
            asgardeoClient.deleteSubOrganization(t.getAsgardeoOrgId());
            tenantUserRepository.deleteAll(tenantUserRepository.findByTenant(t));
            tenantRepository.delete(t);
            log.info("Deleted tenant '{}' (Org: {})", t.getCompanyName(), t.getAsgardeoOrgId());
        });
    }

    public boolean isSubdomainAvailable(String subdomain) {
        return !tenantRepository.existsBySubdomainIgnoreCase(subdomain.trim());
    }

    private Tenant resolveCurrentTenant() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Missing tenant organization context in authenticated token.");
        }

        return tenantRepository.findByAsgardeoOrgId(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant organization not found for orgId: " + orgId));
    }

    private TenantUserDto toUserDto(TenantUser user) {
        return TenantUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
