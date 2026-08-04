package com.invox.Tenant_Provisioning_Service.service;

import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import com.invox.Tenant_Provisioning_Service.dto.ScimGroupRequest;
import com.invox.Tenant_Provisioning_Service.dto.ScimGroupResponse;
import com.invox.Tenant_Provisioning_Service.dto.ScimRolePatchRequest;
import com.invox.Tenant_Provisioning_Service.dto.TokenResponse;

@Service
public class AsgardeoClientService {

    @Value("${asgardeo.client-id}")
    private String clientId;

    @Value("${asgardeo.client-secret}")
    private String clientSecret;

    @Value("${asgardeo.token-url}")
    private String tokenUrl;

    @Value("${asgardeo.scim-group-url}")
    private String scimGroupUrl;

    @Value("${asgardeo.admin-role-id}")
    private String adminRoleId;

    @Value("${asgardeo.org-name}")
    private String orgName;

    private final RestClient restClient = RestClient.create();

    // 1. Get Access Token using Client Credentials
    private String getAccessToken() {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("scope", "internal_group_mgt_create internal_group_mgt_update internal_role_mgt_update internal_user_mgt_view");

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

    // 2. Create the Group in Asgardeo and return its unique ID
    public String provisionTenantAndAssignAdmin(String tenantName, String creatorUuid) {
        String token = getAccessToken();

        // Create Group And assign the creator as a member
        ScimGroupRequest requestBody = new ScimGroupRequest("Tenant_" + tenantName, creatorUuid);

        ScimGroupResponse groupResponse = restClient.post()
                .uri(scimGroupUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .body(requestBody)
                .retrieve()
                .body(ScimGroupResponse.class);

        // Assign the admin role to the creator
        ScimRolePatchRequest rolePatchRequest = new ScimRolePatchRequest(creatorUuid);
        String roleUrl = "https://api.asgardeo.io/t/" + orgName + "/scim2/Roles/" + adminRoleId;

        restClient.patch()
                .uri(roleUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .body(rolePatchRequest)
                .retrieve()
                .toBodilessEntity();

        return groupResponse.id(); // Returns the Asgardeo UUID
    }

}
