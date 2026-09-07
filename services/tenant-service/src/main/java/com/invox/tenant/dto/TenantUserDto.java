package com.invox.tenant.dto;

import com.invox.tenant.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantUserDto {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private boolean active;
    private LocalDateTime createdAt;
}
