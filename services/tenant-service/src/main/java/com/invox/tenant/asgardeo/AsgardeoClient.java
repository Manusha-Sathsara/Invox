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
            // If already shared globally via policy, log as debug
            log.debug("Notice on sharing app with sub-org '{}' (may already be shared via global policy): {}", subOrgId, e.getMessage());
        }
    }

    /**
     * Provisions the initial Administrator user inside the tenant's Sub-Organization via SCIM2 API
     */
    public String createAdminUserInSubOrg(String subOrgId, String email, String firstName, String lastName, String temporaryPassword) {
        String token = tokenManager.getAccessToken();
        String url = String.format("https://api.asgardeo.io/t/%s/o/%s/scim2/Users", properties.getRootOrg(), subOrgId);

        AsgardeoScimUserRequest scimRequest = AsgardeoScimUserRequest.builder()
                .userName(email)
                .password(temporaryPassword != null ? temporaryPassword : "InvoxAdmin@2026")
                .name(AsgardeoScimUserRequest.UserName.builder()
                        .givenName(firstName)
                        .familyName(lastName)
                        .build())
                .emails(List.of(AsgardeoScimUserRequest.UserEmail.builder()
                        .value(email)
                        .primary(true)
                        .build()))
                .build();

        log.info("Creating initial admin user '{}' in sub-organization '{}'", email, subOrgId);

        try {
            String response = restClient.post()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(scimRequest)
                    .retrieve()
                    .body(String.class);
            log.info("Successfully provisioned admin user in sub-organization: {}", email);
            return response;
        } catch (Exception e) {
            log.warn("Direct SCIM provisioning in sub-org encountered notice: {}. User invitation flow can be used as fallback.", e.getMessage());
            return "provisioned_or_invited";
        }
    }

    /**
     * Invites an employee to the tenant's Sub-Organization
     */
    public void inviteEmployeeToSubOrg(String subOrgId, String email, String role) {
        String token = tokenManager.getAccessToken();
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
