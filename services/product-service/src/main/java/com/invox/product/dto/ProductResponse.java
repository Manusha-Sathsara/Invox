package com.invox.product.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private String tenantId;
    private String name;
    private String description;
    private String sku;
    private BigDecimal unitPrice;
    private String currency;
    private BigDecimal taxRate;
    private String unitOfMeasure;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
