package com.invox.Tenant_Provisioning_Service.dto;

public record CreateOrgRequest(String name, String description) {
    public CreateOrgRequest(String name) {
        this(name, "Workspace for " + name);
    }
}
