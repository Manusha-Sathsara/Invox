package com.invox.tenant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantRegisterRequest {

    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 100, message = "Company name must be between 2 and 100 characters")
    private String companyName;

    @NotBlank(message = "Subdomain is required")
    @Size(min = 3, max = 30, message = "Subdomain must be between 3 and 30 characters")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Subdomain can only contain lowercase letters, numbers, and hyphens")
    private String subdomain;

    @NotBlank(message = "Admin email is required")
    @Email(message = "Valid email is required")
    private String adminEmail;

    @NotBlank(message = "First name is required")
    private String adminFirstName;

    @NotBlank(message = "Last name is required")
    private String adminLastName;

    private String adminPassword;
}
