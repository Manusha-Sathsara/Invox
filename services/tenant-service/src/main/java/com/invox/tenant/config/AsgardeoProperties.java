package com.invox.tenant.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "asgardeo")
public class AsgardeoProperties {
    private String rootOrg;
    private String tokenEndpoint;
    private String baseApiUrl;
    private String clientId;
    private String clientSecret;
    private String spaClientId;
    private String scopes;
}
