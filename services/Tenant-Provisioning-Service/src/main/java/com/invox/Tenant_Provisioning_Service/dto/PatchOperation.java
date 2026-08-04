package com.invox.Tenant_Provisioning_Service.dto;

import java.util.List;

public record PatchOperation(String op, String path, List<ScimMember> value) {
}
