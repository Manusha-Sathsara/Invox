package com.invox.tenant.asgardeo;

import com.invox.tenant.asgardeo.dto.AsgardeoTokenResponse;
import com.invox.tenant.config.AsgardeoProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class AsgardeoTokenManager {

    private final AsgardeoProperties properties;
    private final RestClient restClient;

    private String cachedToken;
    private Instant expiryTime = Instant.MIN;

    public synchronized String getAccessToken() {
        // Return cached token if valid (with 60-second buffer)
        if (cachedToken != null && Instant.now().isBefore(expiryTime.minusSeconds(60))) {
            return cachedToken;
        }

        log.info("Requesting fresh M2M token from Asgardeo token endpoint: {}", properties.getTokenEndpoint());

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "client_credentials");
        formData.add("client_id", properties.getClientId());
        formData.add("client_secret", properties.getClientSecret());
        if (properties.getScopes() != null && !properties.getScopes().isBlank()) {
            formData.add("scope", properties.getScopes().trim());
        }

        try {
            AsgardeoTokenResponse response = restClient.post()
                    .uri(properties.getTokenEndpoint())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(AsgardeoTokenResponse.class);

            if (response != null && response.getAccessToken() != null) {
                this.cachedToken = response.getAccessToken();
                long expiresIn = response.getExpiresIn() != null ? response.getExpiresIn() : 3600;
                this.expiryTime = Instant.now().plusSeconds(expiresIn);
                log.info("Successfully acquired Asgardeo M2M token. Valid for {} seconds.", expiresIn);
                log.info("Granted Asgardeo M2M token scopes: {}", response.getScope());
                return this.cachedToken;
            } else {
                throw new IllegalStateException("Failed to obtain M2M access token from Asgardeo: empty response");
            }
        } catch (Exception e) {
            log.error("Error obtaining M2M access token from Asgardeo: {}", e.getMessage(), e);
            throw new RuntimeException("Asgardeo authentication failed: " + e.getMessage(), e);
        }
    }

    /**
     * Obtains a sub-organization scoped token using the organization_switch grant.
     * Exchanges the root M2M token for a sub-org scoped token.
     */
    public String getSubOrgToken(String subOrgId) {
        log.info("Requesting M2M token scoped to sub-organization: {}", subOrgId);

        String rootToken = getAccessToken();

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "organization_switch");
        formData.add("client_id", properties.getClientId());
        formData.add("client_secret", properties.getClientSecret());
        formData.add("token", rootToken);
        formData.add("switching_organization", subOrgId);
        formData.add("scope", "internal_org_user_mgt_create internal_org_user_mgt_view internal_org_user_mgt_list internal_org_role_mgt_view internal_org_role_mgt_update internal_org_role_mgt_users_update");

        try {
            AsgardeoTokenResponse response = restClient.post()
                    .uri(properties.getTokenEndpoint())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(AsgardeoTokenResponse.class);

            if (response != null && response.getAccessToken() != null) {
                log.info("Sub-org token received successfully for org: {}. Granted scopes: {}", subOrgId, response.getScope());
                return response.getAccessToken();
            } else {
                throw new IllegalStateException("Failed to obtain sub-org access token: empty response");
            }
        } catch (Exception e) {
            log.error("Error exchanging token for sub-organization '{}': {}", subOrgId, e.getMessage(), e);
            throw new RuntimeException("Asgardeo sub-organization token exchange failed: " + e.getMessage(), e);
        }
    }
}

