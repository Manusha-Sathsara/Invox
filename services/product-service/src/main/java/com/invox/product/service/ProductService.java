package com.invox.product.service;

import com.invox.product.dto.ProductRequest;
import com.invox.product.dto.ProductResponse;
import com.invox.product.entity.Product;
import com.invox.product.multitenancy.TenantContext;
import com.invox.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        String tenantId = getEffectiveTenantId();
        log.debug("Fetching all products for tenant: {}", tenantId);
        return productRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(UUID id) {
        String tenantId = getEffectiveTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        String tenantId = getEffectiveTenantId();
        log.info("Creating product '{}' for tenant '{}'", request.getName(), tenantId);

        Product product = Product.builder()
                .tenantId(tenantId)
                .name(request.getName().trim())
                .description(request.getDescription())
                .sku(request.getSku() != null ? request.getSku().trim().toUpperCase() : null)
                .unitPrice(request.getUnitPrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .taxRate(request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO)
                .unitOfMeasure(request.getUnitOfMeasure() != null ? request.getUnitOfMeasure() : "UNIT")
                .active(true)
                .build();

        Product saved = productRepository.save(product);
        return mapToResponse(saved);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, ProductRequest request) {
        String tenantId = getEffectiveTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));

        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        if (request.getSku() != null) {
            product.setSku(request.getSku().trim().toUpperCase());
        }
        product.setUnitPrice(request.getUnitPrice());
        if (request.getCurrency() != null) {
            product.setCurrency(request.getCurrency());
        }
        if (request.getTaxRate() != null) {
            product.setTaxRate(request.getTaxRate());
        }
        if (request.getUnitOfMeasure() != null) {
            product.setUnitOfMeasure(request.getUnitOfMeasure());
        }

        Product updated = productRepository.save(product);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteProduct(UUID id) {
        String tenantId = getEffectiveTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + id));
        productRepository.delete(product);
        log.info("Deleted product with ID: {} for tenant: {}", id, tenantId);
    }

    private String getEffectiveTenantId() {
        String tenantId = TenantContext.getTenantId();
        return (tenantId != null && !tenantId.isBlank()) ? tenantId : "default-tenant";
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .tenantId(product.getTenantId())
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
                .unitPrice(product.getUnitPrice())
                .currency(product.getCurrency())
                .taxRate(product.getTaxRate())
                .unitOfMeasure(product.getUnitOfMeasure())
                .active(product.getActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
