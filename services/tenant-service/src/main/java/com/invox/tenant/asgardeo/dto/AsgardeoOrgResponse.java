package com.invox.tenant.asgardeo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AsgardeoOrgResponse {
    private String id;
    private String name;
    private String description;
    private String status;
    private String orgHandle;
}

