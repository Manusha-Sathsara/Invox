package ieeeyp.invox.user_service.service;

import ieeeyp.invox.user_service.entity.Tenant;
import ieeeyp.invox.user_service.entity.User;
import ieeeyp.invox.user_service.repository.TenantRepository;
import ieeeyp.invox.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSyncService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    @Transactional
    public User syncUserFromJwt(String asgardeoUuid, String orgId, String email) {
        log.info("Starting JIT sync for user {} in organization {}", asgardeoUuid, orgId);

        // 1. Lookup or create Tenant
        Tenant tenant = tenantRepository.findByAsgardeoOrgId(orgId)
                .orElseGet(() -> {
                    log.info("Creating new tenant workspace for Asgardeo orgId: {}", orgId);
                    Tenant newTenant = Tenant.builder()
                            .asgardeoOrgId(orgId)
                            .createdAt(Instant.now())
                            .build();
                    return tenantRepository.save(newTenant);
                });

        // 2. Lookup User
        return userRepository.findByAsgardeoUuid(asgardeoUuid)
                .map(existingUser -> {
                    log.info("Updating existing user: {}", asgardeoUuid);
                    existingUser.setLastLoginAt(Instant.now());
                    if (email != null && !email.isBlank()) {
                        existingUser.setEmail(email);
                    }
                    if (existingUser.getTenant() == null || !Objects.equals(existingUser.getTenant().getId(), tenant.getId())) {
                        existingUser.setTenant(tenant);
                    }
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    log.info("Provisioning new user: {} for tenant orgId: {}", asgardeoUuid, orgId);
                    User newUser = User.builder()
                            .asgardeoUuid(asgardeoUuid)
                            .email(email)
                            .lastLoginAt(Instant.now())
                            .tenant(tenant)
                            .build();
                    return userRepository.save(newUser);
                });
    }
}
