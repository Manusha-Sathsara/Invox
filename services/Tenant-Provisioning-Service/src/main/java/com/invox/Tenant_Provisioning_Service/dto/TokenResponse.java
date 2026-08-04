package com.invox.Tenant_Provisioning_Service.dto;

public record TokenResponse(String access_token, int expires_in, String token_type) {
}
