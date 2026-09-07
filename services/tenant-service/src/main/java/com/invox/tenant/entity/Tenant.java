package com.invox.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants", indexes = {
    @Index(name = "idx_tenants_subdomain", columnList = "subdomain", unique = true),
    @Index(name = "idx_tenants_org_id", columnList = "asgardeo_org_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(nullable = false, unique = true, length = 50)
    private String subdomain;

    @Column(name = "asgardeo_org_id", nullable = false, unique = true, length = 100)
    private String asgardeoOrgId;

    @Column(name = "asgardeo_org_handle", length = 100)
    private String asgardeoOrgHandle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TenantStatus status = TenantStatus.ACTIVE;

    @Column(length = 50)
    @Builder.Default
    private String plan = "FREE_TIER";

    @Column(name = "admin_email", nullable = false, length = 150)
    private String adminEmail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
