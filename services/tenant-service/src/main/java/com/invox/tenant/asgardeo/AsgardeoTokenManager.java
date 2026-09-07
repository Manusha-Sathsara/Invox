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
                return this.cachedToken;
            } else {
                throw new IllegalStateException("Failed to obtain M2M access token from Asgardeo: empty response");
            }
        } catch (Exception e) {
            log.error("Error obtaining M2M access token from Asgardeo: {}", e.getMessage(), e);
            throw new RuntimeException("Asgardeo authentication failed: " + e.getMessage(), e);
        }
    }
}
