package com.invox.tenant.dto;

import com.invox.tenant.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInviteRequest {

    @NotBlank(message = "Employee email is required")
    @Email(message = "Valid email is required")
    private String email;

    private String firstName;
    private String lastName;

    @NotNull(message = "Role is required")
    private UserRole role;
}
