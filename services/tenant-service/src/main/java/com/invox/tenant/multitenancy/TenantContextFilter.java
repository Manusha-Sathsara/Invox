package com.invox.tenant.multitenancy;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
public class TenantContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. Extract from X-Tenant-Id header if passed
            String headerTenantId = request.getHeader("X-Tenant-Id");
            if (headerTenantId != null && !headerTenantId.trim().isEmpty()) {
                TenantContext.setOrgId(headerTenantId.trim());
            }

            // 2. Extract from validated JWT token
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                String orgId = jwt.getClaimAsString("org_id");
                if (orgId == null || orgId.isBlank()) {
                    orgId = jwt.getClaimAsString("organization_id");
                }
                if (orgId == null || orgId.isBlank()) {
                    orgId = jwt.getClaimAsString("org_handle");
                }

                String username = jwt.getClaimAsString("username");
                if (username == null || username.isBlank()) {
                    username = jwt.getClaimAsString("email");
                }
                if (username == null || username.isBlank()) {
                    username = jwt.getSubject();
                }

                if (orgId != null && !orgId.isBlank()) {
                    TenantContext.setOrgId(orgId);
                }
                if (username != null && !username.isBlank()) {
                    TenantContext.setUserEmail(username);
                }
                log.debug("Tenant Context established: orgId={}, user={}", TenantContext.getOrgId(), TenantContext.getUserEmail());
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
