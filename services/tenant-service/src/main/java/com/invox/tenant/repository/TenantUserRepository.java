package com.invox.tenant.repository;

import com.invox.tenant.entity.Tenant;
import com.invox.tenant.entity.TenantUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantUserRepository extends JpaRepository<TenantUser, UUID> {
    List<TenantUser> findByTenant(Tenant tenant);
    Optional<TenantUser> findByTenantAndEmailIgnoreCase(Tenant tenant, String email);
    Optional<TenantUser> findByAsgardeoUserId(String asgardeoUserId);
    boolean existsByTenantAndEmailIgnoreCase(Tenant tenant, String email);
}
