package com.invox.tenant.repository;

import com.invox.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findBySubdomainIgnoreCase(String subdomain);
    Optional<Tenant> findByAsgardeoOrgId(String asgardeoOrgId);
    boolean existsBySubdomainIgnoreCase(String subdomain);
    boolean existsByAdminEmailIgnoreCase(String adminEmail);
}
