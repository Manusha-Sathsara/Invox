package com.invox.tenant.asgardeo.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AsgardeoScimUserRequest {

    @Builder.Default
    private List<String> schemas = List.of("urn:ietf:params:scim:schemas:core:2.0:User");

    private String userName;
    private UserName name;
    private List<UserEmail> emails;
    private String password;
    @Builder.Default
    private Boolean active = true;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserName {
        private String givenName;
        private String familyName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserEmail {
        private String value;
        private boolean primary;
    }
}
