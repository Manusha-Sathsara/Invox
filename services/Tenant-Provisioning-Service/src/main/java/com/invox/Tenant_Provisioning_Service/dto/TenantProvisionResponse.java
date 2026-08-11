package com.invox.Tenant_Provisioning_Service.dto;

import java.util.UUID;

/**
 * Response DTO returned to the frontend after a workspace is provisioned.
 * Avoids exposing the JPA entity directly over the API.
 */
public record TenantProvisionResponse(
        UUID tenantId,
        String tenantName,
        String asgardeoSuborgId
) {}
