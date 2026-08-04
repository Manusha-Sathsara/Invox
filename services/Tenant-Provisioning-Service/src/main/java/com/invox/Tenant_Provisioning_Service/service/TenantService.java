package com.invox.Tenant_Provisioning_Service.service;

import org.springframework.stereotype.Service;

import com.invox.Tenant_Provisioning_Service.entity.TenantEntity;
import com.invox.Tenant_Provisioning_Service.repo.TenantRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TenantService {
    private final AsgardeoClientService asgardeoClientService;
    private final TenantRepo tenantRepo;

    public TenantEntity provisionNewTenant(String tenantName, String creatorUuid) {
        // 1. Ask Asgardeo to create the group
        String asgardeoGroupId = asgardeoClientService.provisionTenantAndAssignAdmin(tenantName, creatorUuid);

        // 2. Save the association in PostgreSQL
        TenantEntity tenant = new TenantEntity();
        tenant.setName(tenantName);
        tenant.setAsgardeoGroupId(asgardeoGroupId);

        return tenantRepo.save(tenant);
    }
}
