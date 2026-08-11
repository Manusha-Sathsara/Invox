package com.invox.Tenant_Provisioning_Service.service;

import org.springframework.stereotype.Service;

import com.invox.Tenant_Provisioning_Service.dto.TenantProvisionResponse;
import com.invox.Tenant_Provisioning_Service.entity.TenantEntity;
import com.invox.Tenant_Provisioning_Service.repo.TenantRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TenantService {
    private final AsgardeoClientService asgardeoClientService;
    private final TenantRepo tenantRepo;

    public TenantProvisionResponse provisionNewTenant(String tenantName, String creatorUuid) {
        // 1. Ask Asgardeo to create the SubOrg and share the creator into it as admin
        String asgardeoSubOrgId = asgardeoClientService.provisionTenantAndAssignAdmin(tenantName, creatorUuid);

        // 2. Save the workspace in PostgreSQL, including who created it
        TenantEntity tenant = new TenantEntity();
        tenant.setName(tenantName);
        tenant.setAsgardeoSuborgId(asgardeoSubOrgId);
        tenant.setCreatorId(creatorUuid);

        TenantEntity saved = tenantRepo.save(tenant);

        // 3. Return a shaped response DTO (not the raw JPA entity)
        return new TenantProvisionResponse(
                saved.getId(),
                saved.getName(),
                saved.getAsgardeoSuborgId()
        );
    }
}
