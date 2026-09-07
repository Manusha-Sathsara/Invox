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
public class AsgardeoCreateOrgRequest {
    private String name;
    private String description;
    private String orgHandle;
    private ParentOrg parent;
    private List<OrgAttribute> attributes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentOrg {
        private String id;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrgAttribute {
        private String key;
        private String value;
    }
}
