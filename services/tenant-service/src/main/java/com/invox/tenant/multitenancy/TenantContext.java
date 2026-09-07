package com.invox.tenant.multitenancy;

public class TenantContext {
    private static final ThreadLocal<String> CURRENT_TENANT_ORG_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_USER_EMAIL = new ThreadLocal<>();

    public static void setOrgId(String orgId) {
        CURRENT_TENANT_ORG_ID.set(orgId);
    }

    public static String getOrgId() {
        return CURRENT_TENANT_ORG_ID.get();
    }

    public static void setUserEmail(String email) {
        CURRENT_USER_EMAIL.set(email);
    }

    public static String getUserEmail() {
        return CURRENT_USER_EMAIL.get();
    }

    public static void clear() {
        CURRENT_TENANT_ORG_ID.remove();
        CURRENT_USER_EMAIL.remove();
    }
}
