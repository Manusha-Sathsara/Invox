package com.invox.Tenant_Provisioning_Service.service;

import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import com.invox.Tenant_Provisioning_Service.dto.CreateOrgRequest;
import com.invox.Tenant_Provisioning_Service.dto.CreateOrgResponse;
import com.invox.Tenant_Provisioning_Service.dto.ShareUserRequest;
import com.invox.Tenant_Provisioning_Service.dto.TokenResponse;

@Service
public class AsgardeoClientService {

        @Value("${asgardeo.base-url}")
        private String asgardeoBaseUrl;

        @Value("${asgardeo.client-id}")
        private String clientId;

        @Value("${asgardeo.client-secret}")
        private String clientSecret;

        @Value("${asgardeo.token-url}")
        private String tokenUrl;

        @Value("${asgardeo.admin-role-id}")
        private String adminRoleId;

        @Value("${asgardeo.org-name}")
        private String rootOrgName;

        /** The B2B Organization Management Endpoint */
        private String getOrgApiUrl() {
                return asgardeoBaseUrl + "/t/" + rootOrgName + "/api/server/v1/organizations";
        }

        /** The V1 endpoint to share a root-org user into sub-orgs */
        private String getShareUserUrl() {
                return asgardeoBaseUrl + "/t/" + rootOrgName + "/o/api/server/v1/users/share";
        }

        /**
         * SCIM v2 Roles endpoint — must be called with a sub-org scoped token.
         * Path uses /o/ with the sub-org context, not /t/.
         */
        private String getSubOrgRolePatchUrl() {
                return asgardeoBaseUrl + "/o/scim2/v2/Roles/" + adminRoleId;
        }

        private final RestClient restClient = RestClient.create();

        // 1. Get root-org M2M Access Token using Client Credentials
        private String getAccessToken() {
                MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
                body.add("grant_type", "client_credentials");
                // Scopes required for sub-org creation + user sharing
                body.add("scope",
                                "internal_organization_create internal_organization_view internal_org_user_share");

                String credentials = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());

                TokenResponse response = restClient.post()
                                .uri(tokenUrl)
                                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                                .header("Authorization", "Basic " + credentials)
                                .body(body)
                                .retrieve()
                                .body(TokenResponse.class);

                return response.access_token();
        }

        /**
         * Exchange the root-org M2M token for a sub-org scoped token using
         * Asgardeo's Organization Switch (Token Exchange) grant.
         * The sub-org token is required to call SCIM APIs within the sub-org context.
         */
        private String getSubOrgToken(String rootOrgToken, String subOrgId) {
                MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
                body.add("grant_type", "organization_switch");
                body.add("token", rootOrgToken);
                body.add("scope", "internal_role_mgt_update internal_role_mgt_users_update");
                body.add("switching_organization", subOrgId);

                String credentials = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());

                TokenResponse response = restClient.post()
                                .uri(tokenUrl)
                                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                                .header("Authorization", "Basic " + credentials)
                                .body(body)
                                .retrieve()
                                .body(TokenResponse.class);

                return response.access_token();
        }

        // Main provisioning flow
        public String provisionTenantAndAssignAdmin(String workspaceName, String creatorUuid) {
                String rootToken = getAccessToken();

                // Step 1: Create the SubOrg
                CreateOrgRequest orgRequest = new CreateOrgRequest(workspaceName);

                CreateOrgResponse orgResponse = restClient.post()
                                .uri(getOrgApiUrl())
                                .contentType(MediaType.APPLICATION_JSON)
                                .header("Authorization", "Bearer " + rootToken)
                                .body(orgRequest)
                                .retrieve()
                                .body(CreateOrgResponse.class);

                String subOrgId = orgResponse.id();

                // Step 2: Share the creator into the sub-org (root token is valid here)
                ShareUserRequest shareRequest = new ShareUserRequest(creatorUuid, subOrgId);

                restClient.post()
                                .uri(getShareUserUrl())
                                .contentType(MediaType.APPLICATION_JSON)
                                .header("Authorization", "Bearer " + rootToken)
                                .body(shareRequest)
                                .retrieve()
                                .toBodilessEntity();

                // Step 3: Switch to a sub-org scoped token — required for SCIM within the
                // sub-org
                String subOrgToken = getSubOrgToken(rootToken, subOrgId);

                // Step 4: Assign the admin role to the shared user via SCIM Roles PATCH
                String rolePatchPayload = String.format("""
                                {
                                    "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                                    "Operations": [{
                                        "op": "add",
                                        "path": "users",
                                        "value": [{"value": "%s"}]
                                    }]
                                }
                                """, creatorUuid);

                restClient.patch()
                                .uri(getSubOrgRolePatchUrl())
                                .contentType(MediaType.APPLICATION_JSON)
                                .header("Authorization", "Bearer " + subOrgToken)
                                .body(rolePatchPayload)
                                .retrieve()
                                .toBodilessEntity();

                return subOrgId;
        }

}
