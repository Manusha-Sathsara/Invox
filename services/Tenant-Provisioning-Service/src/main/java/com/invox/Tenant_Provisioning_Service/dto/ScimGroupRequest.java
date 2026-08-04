package com.invox.Tenant_Provisioning_Service.dto;

import java.util.List;

public record ScimGroupRequest(String displayName, String[] schemas, List<ScimMember> members) {
    public ScimGroupRequest(String displayName, String creatorUuid) {
        this(
                displayName,
                new String[] { "urn:ietf:params:scim:schemas:core:2.0:Group" },
                List.of(new ScimMember(creatorUuid)) // Injects the user into the group
        );
    }
}
