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
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                // Asgardeo token contains 'org_id' or 'org_name' claim
                String orgId = jwt.getClaimAsString("org_id");
                if (orgId == null || orgId.isBlank()) {
                    orgId = jwt.getClaimAsString("organization_id");
                }

                String username = jwt.getClaimAsString("username");
                if (username == null || username.isBlank()) {
                    username = jwt.getSubject();
                }

                if (orgId != null) {
                    TenantContext.setOrgId(orgId);
                }
                if (username != null) {
                    TenantContext.setUserEmail(username);
                }
                log.debug("Tenant Context set: orgId={}, user={}", orgId, username);
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
