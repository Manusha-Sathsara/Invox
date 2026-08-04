package com.invox.Tenant_Provisioning_Service.controller;

import java.util.Base64;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.invox.Tenant_Provisioning_Service.dto.CreateTenantRequest;
import com.invox.Tenant_Provisioning_Service.entity.TenantEntity;
import com.invox.Tenant_Provisioning_Service.service.TenantService;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
// Mapping name can be changed
@RequestMapping("/api/v1/tenant")
public class TenantController {

    private final TenantService tenantService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping
    public ResponseEntity<TenantEntity> createTenant(
            @RequestBody CreateTenantRequest request,
            @RequestHeader("X-JWT-Assertion") String backendJwt) throws Exception {

        // Decode the Backend JWT payload
        String[] jwtParts = backendJwt.split("\\.");
        if (jwtParts.length < 2) {
            return ResponseEntity.status(401).build(); // Invalid token format
        }

        String payloadJson = new String(Base64.getUrlDecoder().decode(jwtParts[1]));
        JsonNode payload = objectMapper.readTree(payloadJson);

        // Extract Asgardeo User UUID
        String creatorUuid = payload.path("sub").asString();

        // Pass both to the service
        TenantEntity newTenant = tenantService.provisionNewTenant(request.tenantName(), creatorUuid);

        return ResponseEntity.ok(newTenant);
    }
}
