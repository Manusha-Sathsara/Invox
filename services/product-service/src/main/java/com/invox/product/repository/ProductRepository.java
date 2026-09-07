package com.invox.product.repository;

import com.invox.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    Optional<Product> findByIdAndTenantId(UUID id, String tenantId);
    boolean existsBySkuAndTenantId(String sku, String tenantId);
}
