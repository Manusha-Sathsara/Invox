package com.invox.tenant.asgardeo;

import com.invox.tenant.asgardeo.dto.*;
import com.invox.tenant.config.AsgardeoProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsgardeoClient {

    private final AsgardeoProperties properties;
    private final AsgardeoTokenManager tokenManager;
    private final RestClient restClient;

    /**
     * Creates a new B2B Sub-Organization in Asgardeo under the Root Organization
     */
    public AsgardeoOrgResponse createSubOrganization(String companyName, String orgHandle) {
        String token = tokenManager.getAccessToken();
        String url = String.format("https://api.asgardeo.io/t/%s/api/server/v1/organizations", properties.getRootOrg());

        AsgardeoCreateOrgRequest request = AsgardeoCreateOrgRequest.builder()
                .name(companyName)
                .description("INVOX Tenant: " + companyName)
                .build();

        log.info("Creating Asgardeo sub-organization '{}' (handle: '{}')", companyName, orgHandle);

        try {
            return restClient.post()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(AsgardeoOrgResponse.class);
        } catch (Exception e) {
            log.error("Failed to create Asgardeo sub-organization '{}': {}", companyName, e.getMessage(), e);
            throw new RuntimeException("Asgardeo sub-organization creation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes a Sub-Organization from Asgardeo (frees up free tier quota)
     */
    public void deleteSubOrganization(String subOrgId) {
        String token = tokenManager.getAccessToken();
        String url = String.format("https://api.asgardeo.io/t/%s/api/server/v1/organizations/%s", properties.getRootOrg(), subOrgId);

        log.info("Deleting Asgardeo sub-organization '{}'", subOrgId);
        try {
            restClient.delete()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Successfully deleted Asgardeo sub-organization '{}'", subOrgId);
        } catch (Exception e) {
            log.warn("Notice on deleting Asgardeo sub-org '{}': {}", subOrgId, e.getMessage());
        }
    }

    /**
     * Shares the SPA application with a newly created sub-organization if needed
     */
    public void shareAppWithSubOrg(String subOrgId) {
        if (properties.getSpaClientId() == null || properties.getSpaClientId().isBlank()) {
            log.warn("No SPA Client ID configured to share with sub-organization.");
            return;
        }

        String token = tokenManager.getAccessToken();
        String url = String.format("https://api.asgardeo.io/t/%s/api/server/v1/applications/%s/share",
                properties.getRootOrg(), properties.getSpaClientId());

        AsgardeoShareAppRequest shareRequest = AsgardeoShareAppRequest.builder()
                .shareWithAllChildren(false)
                .sharedOrganizations(List.of(subOrgId))
                .build();

        try {
            restClient.post()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(shareRequest)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Shared SPA application '{}' with sub-organization '{}'", properties.getSpaClientId(), subOrgId);
        } catch (Exception e) {
            log.warn("Notice on sharing app with sub-org '{}' (verify SPA Application UUID in .env): {}", subOrgId, e.getMessage());
        }
    }

    /**
     * Obtains an organization-switched M2M token for a sub-organization
     */
    public String getSubOrgToken(String subOrgId) {
        return tokenManager.getSubOrgToken(subOrgId);
    }

    /**
     * Provisions the initial Administrator user inside the tenant's Sub-Organization via SCIM2 API
     */
    public String createAdminUserInSubOrg(String subOrgId, String email, String firstName, String lastName, String temporaryPassword, String subToken) {
        // Sub-org SCIM URL: /t/{rootOrg}/o/scim2/Users (sub-org context is carried in subToken)
        String url = String.format("https://api.asgardeo.io/t/%s/o/scim2/Users", properties.getRootOrg());

        // Prefix with DEFAULT/ to target the local writable user store
        String username = email.startsWith("DEFAULT/") ? email : "DEFAULT/" + email;

        AsgardeoScimUserRequest scimRequest = AsgardeoScimUserRequest.builder()
                .userName(username)
                .password(temporaryPassword != null ? temporaryPassword : "InvoxAdmin@2026")
                .name(AsgardeoScimUserRequest.UserName.builder()
                        .givenName(firstName)
                        .familyName(lastName != null && !lastName.isBlank() ? lastName : "Admin")
                        .build())
                .emails(List.of(AsgardeoScimUserRequest.UserEmail.builder()
                        .value(email)
                        .primary(true)
                        .build()))
                .build();

        log.info("Creating initial admin user '{}' in sub-organization '{}'", username, subOrgId);

        try {
            org.springframework.http.ResponseEntity<String> responseEntity = restClient.post()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + subToken)
                    .header(HttpHeaders.ACCEPT, "application/json, application/scim+json")
                    .contentType(MediaType.parseMediaType("application/scim+json"))
                    .body(scimRequest)
                    .retrieve()
                    .toEntity(String.class);

            String response = responseEntity.getBody();
            log.info("Provision admin user SCIM response - Status: {}, Body: {}", 
                    responseEntity.getStatusCode(), response);

            if (response != null && response.contains("\"id\"")) {
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(response);
                if (node.hasNonNull("id")) {
                    String userId = node.get("id").asText();
                    log.info("Admin user created successfully with ID: {}", userId);
                    return userId;
                }
            }
            throw new IllegalStateException("SCIM user creation returned response without user ID: " + response);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            log.error("Direct SCIM provisioning in sub-org failed with status {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("SCIM user creation failed (" + e.getStatusCode() + "): " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Direct SCIM provisioning in sub-org error: {}", e.getMessage(), e);
            throw new RuntimeException("SCIM user creation failed: " + e.getMessage(), e);
        }
    }

    public String createAdminUserInSubOrg(String subOrgId, String email, String firstName, String lastName, String temporaryPassword) {
        String subToken = getSubOrgToken(subOrgId);
        return createAdminUserInSubOrg(subOrgId, email, firstName, lastName, temporaryPassword, subToken);
    }

    /**
     * Assigns the Administrator role to the user inside the tenant's Sub-Organization
     */
    public void assignAdminRoleInSubOrg(String subOrgId, String userId, String subToken) {
        log.info("Assigning Admin role to userId: '{}' in sub-organization '{}'", userId, subOrgId);
        String roleName = "Administrator";

        try {
            // 1. Search for the Role ID using SCIM2 filtering
            String searchUrl = String.format("https://api.asgardeo.io/t/%s/o/scim2/v2/Roles?filter={filter}", properties.getRootOrg());
            String searchResponse = restClient.get()
                    .uri(searchUrl, "displayName eq \"" + roleName + "\"")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + subToken)
                    .header(HttpHeaders.ACCEPT, "application/json, application/scim+json")
                    .retrieve()
                    .body(String.class);

            com.fasterxml.jackson.databind.JsonNode rootNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(searchResponse);
            com.fasterxml.jackson.databind.JsonNode resources = rootNode.path("Resources");

            if (!resources.isArray() || resources.isEmpty()) {
                throw new IllegalStateException("Role '" + roleName + "' not found in sub-organization: " + subOrgId);
            }

            String roleId = resources.get(0).path("id").asText();
            log.info("Found role '{}' with ID: {} in sub-organization: {}", roleName, roleId, subOrgId);

            // 2. SCIM2 PATCH payload to add user to the role
            Map<String, Object> patchBody = Map.of(
                    "schemas", List.of("urn:ietf:params:scim:api:messages:2.0:PatchOp"),
                    "Operations", List.of(
                            Map.of(
                                    "op", "add",
                                    "path", "users",
                                    "value", List.of(Map.of("value", userId))
                            )
                    )
            );

            // 3. PATCH the role
            String patchUrl = String.format("https://api.asgardeo.io/t/%s/o/scim2/v2/Roles/%s", properties.getRootOrg(), roleId);
            restClient.patch()
                    .uri(patchUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + subToken)
                    .contentType(MediaType.parseMediaType("application/scim+json"))
                    .body(patchBody)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Successfully assigned Admin role to userId: '{}' in sub-organization: '{}'", userId, subOrgId);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            log.error("Role assignment in sub-org failed with status {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Role assignment failed (" + e.getStatusCode() + "): " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Failed to assign Admin role in sub-organization '{}': {}", subOrgId, e.getMessage(), e);
            throw new RuntimeException("Failed to assign Admin role: " + e.getMessage(), e);
        }
    }

    public void assignAdminRoleInSubOrg(String subOrgId, String userId) {
        String subToken = getSubOrgToken(subOrgId);
        assignAdminRoleInSubOrg(subOrgId, userId, subToken);
    }

    /**
     * Invites an employee to the tenant's Sub-Organization
     */
    public void inviteEmployeeToSubOrg(String subOrgId, String email, String role) {
        String token = getSubOrgToken(subOrgId);
        String url = String.format("https://api.asgardeo.io/t/%s/o/%s/api/server/v1/guest-invitations", properties.getRootOrg(), subOrgId);

        AsgardeoGuestInviteRequest inviteRequest = AsgardeoGuestInviteRequest.builder()
                .username(email)
                .roles(List.of(role))
                .build();

        log.info("Inviting employee '{}' with role '{}' to sub-organization '{}'", email, role, subOrgId);

        try {
            restClient.post()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(inviteRequest)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Guest invitation sent successfully to {}", email);
        } catch (Exception e) {
            log.warn("Guest invitation API response: {}", e.getMessage());
        }
    }
}

