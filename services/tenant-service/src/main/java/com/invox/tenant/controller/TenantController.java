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
     * User-specific endpoint: Get only the tenant workspaces that belong to the user
     */
    @GetMapping("/my-tenants")
    public ResponseEntity<List<TenantResponse>> getMyTenants(@RequestParam(required = false) String email) {
        return ResponseEntity.ok(tenantService.getTenantsForUser(email));
    }

    /**
     * User-specific endpoint: Get real user profile by email and active tenant
     */
    @GetMapping("/profile")
    public ResponseEntity<TenantUserDto> getUserProfile(
            @RequestParam String email,
            @RequestParam(required = false) String tenant) {
        return ResponseEntity.ok(tenantService.resolveUserProfile(email, tenant));
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

    /**
     * Protected endpoint: Update an organization user (role, name, status)
     */
    @PutMapping("/users/{userId}")
    public ResponseEntity<TenantUserDto> updateUser(
            @PathVariable java.util.UUID userId,
            @RequestBody UserUpdateRequest request) {
        TenantUserDto updated = tenantService.updateUser(userId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Protected endpoint: Toggle user active / suspended status
     */
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<TenantUserDto> toggleUserStatus(
            @PathVariable java.util.UUID userId,
            @RequestParam boolean active) {
        TenantUserDto updated = tenantService.toggleUserStatus(userId, active);
        return ResponseEntity.ok(updated);
    }

    /**
     * Protected endpoint: Remove a user from the organization
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> removeUser(@PathVariable java.util.UUID userId) {
        tenantService.removeUser(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Public helper endpoint: Look up tenant details by subdomain
     */
    @GetMapping("/by-subdomain/{subdomain}")
    public ResponseEntity<TenantResponse> getTenantBySubdomain(@PathVariable String subdomain) {
        TenantResponse response = tenantService.getTenantBySubdomain(subdomain);
        return ResponseEntity.ok(response);
    }
}
