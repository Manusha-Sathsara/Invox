package com.invox.Tenant_Provisioning_Service.repo;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.invox.Tenant_Provisioning_Service.entity.TenantEntity;

public interface TenantRepo extends JpaRepository<TenantEntity, UUID> {

}
