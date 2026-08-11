package com.invox.Tenant_Provisioning_Service.dto;

import java.util.List;

/**
 * Request DTO for the Asgardeo V1 User Sharing API.
 * POST /t/{org}/o/api/server/v1/users/share
 *
 * Expected payload:
 * {
 *   "userCriteria": { "userIds": ["user-uuid"] },
 *   "organizations": [{ "orgId": "sub-org-id", "policy": "SELECTED_ORG_ONLY" }]
 * }
 *
 * Note: Role assignment is done separately after sharing.
 */
public record ShareUserRequest(UserCriteria userCriteria, List<ShareOrganization> organizations) {

    /**
     * Convenience constructor for sharing a single user into a single sub-org.
     */
    public ShareUserRequest(String userId, String subOrgId) {
        this(
                new UserCriteria(List.of(userId)),
                List.of(new ShareOrganization(subOrgId, "SELECTED_ORG_ONLY"))
        );
    }

    public record UserCriteria(List<String> userIds) {}

    public record ShareOrganization(String orgId, String policy) {}
}
