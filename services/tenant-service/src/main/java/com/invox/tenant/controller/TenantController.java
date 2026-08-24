package com.invox.tenant.controller;

import com.invox.tenant.dto.*;
import com.invox.tenant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    /**
     * Public endpoint: Self-service tenant registration (creates Asgardeo Sub-Org + DB record)
     */
    @PostMapping("/register")
    public ResponseEntity<TenantResponse> register(@Valid @RequestBody TenantRegisterRequest request) {
        TenantResponse response = tenantService.registerTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Public endpoint: List all registered tenants (for testbed UI)
     */
    @GetMapping("/public-list")
    public ResponseEntity<List<TenantResponse>> getAllTenants() {
        return ResponseEntity.ok(tenantService.getAllTenants());
    }

    /**
     * Public helper endpoint: Delete a tenant and its sub-organization
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTenant(@PathVariable java.util.UUID id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Public endpoint: Check if a subdomain is available
     */
    @GetMapping("/check-subdomain/{subdomain}")
    public ResponseEntity<Map<String, Boolean>> checkSubdomain(@PathVariable String subdomain) {
        boolean available = tenantService.isSubdomainAvailable(subdomain);
        return ResponseEntity.ok(Map.of("available", available));
    }

    /**
     * Protected endpoint: Get current tenant organization info
     */
    @GetMapping("/me")
    public ResponseEntity<TenantResponse> getCurrentTenant() {
        TenantResponse response = tenantService.getCurrentTenant();
        return ResponseEntity.ok(response);
    }

    /**
     * Protected endpoint: Invite a new user to the organization
     */
    @PostMapping("/users/invite")
    public ResponseEntity<TenantUserDto> inviteEmployee(@Valid @RequestBody UserInviteRequest request) {
        TenantUserDto user = tenantService.inviteEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    /**
     * Protected endpoint: List all users in the current organization
     */
    @GetMapping("/users")
    public ResponseEntity<List<TenantUserDto>> getTenantUsers() {
        List<TenantUserDto> users = tenantService.getTenantUsers();
        return ResponseEntity.ok(users);
    }
}
