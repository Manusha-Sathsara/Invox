package com.invox.Tenant_Provisioning_Service.dto;

import java.util.List;

public record ScimRolePatchRequest(List<String> schemas, List<PatchOperation> Operations) {
    public ScimRolePatchRequest(String userUuid) {
        this(
                List.of("urn:ietf:params:scim:api:messages:2.0:PatchOp"),
                List.of(new PatchOperation("add", "users", List.of(new ScimMember(userUuid)))));
    }
}
