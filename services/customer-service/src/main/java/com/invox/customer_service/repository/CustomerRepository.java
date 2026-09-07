package com.invox.customer_service.repository;

import com.invox.customer_service.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    List<Customer> findByTenantIdAndActiveOrderByCreatedAtDesc(String tenantId, Boolean active);

    List<Customer> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    Optional<Customer> findByIdAndTenantId(UUID id, String tenantId);

    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tenantId AND c.active = true " +
           "AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY c.createdAt DESC")
    List<Customer> searchCustomers(@Param("tenantId") String tenantId, @Param("search") String search);

    boolean existsByEmailAndTenantId(String email, String tenantId);
}
