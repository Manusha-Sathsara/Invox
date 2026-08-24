package com.invox.tenant.dto;

import com.invox.tenant.entity.TenantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponse {
    private UUID id;
    private String companyName;
    private String subdomain;
    private String asgardeoOrgId;
    private String asgardeoOrgHandle;
    private TenantStatus status;
    private String plan;
    private String adminEmail;
    private String loginUrl;
    private LocalDateTime createdAt;
}
