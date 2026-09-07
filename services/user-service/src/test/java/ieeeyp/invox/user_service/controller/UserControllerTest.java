package ieeeyp.invox.user_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import ieeeyp.invox.user_service.entity.Tenant;
import ieeeyp.invox.user_service.entity.User;
import ieeeyp.invox.user_service.service.UserSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserSyncService userSyncService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    }

    private String createMockJwt(String sub, String orgId, String email) {
        String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payloadJson;
        if (email != null) {
            payloadJson = String.format("{\"sub\":\"%s\",\"org_id\":\"%s\",\"email\":\"%s\"}", sub, orgId, email);
        } else {
            payloadJson = String.format("{\"sub\":\"%s\",\"org_id\":\"%s\"}", sub, orgId);
        }
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        return header + "." + payload + ".mockSignature";
    }

    @Test
    @DisplayName("GET /api/users/me should decode X-JWT-Assertion and return synced User")
    void testGetCurrentUser_Success() throws Exception {
        String sub = "sub-12345";
        String orgId = "org-67890";
        String email = "john.doe@example.com";
        String mockJwt = createMockJwt(sub, orgId, email);

        Tenant mockTenant = Tenant.builder()
                .id(UUID.randomUUID())
                .asgardeoOrgId(orgId)
                .createdAt(Instant.now())
                .build();

        User mockUser = User.builder()
                .id(UUID.randomUUID())
                .asgardeoUuid(sub)
                .email(email)
                .lastLoginAt(Instant.now())
                .tenant(mockTenant)
                .build();

        when(userSyncService.syncUserFromJwt(eq(sub), eq(orgId), eq(email))).thenReturn(mockUser);

        mockMvc.perform(get("/api/users/me")
                        .header("X-JWT-Assertion", mockJwt)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(mockUser.getId().toString()))
                .andExpect(jsonPath("$.asgardeoUuid").value(sub))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.tenant.asgardeoOrgId").value(orgId));
    }

    @Test
    @DisplayName("POST /api/users/init should decode X-JWT-Assertion and return synced User")
    void testInitCurrentUser_Success() throws Exception {
        String sub = "sub-init-123";
        String orgId = "org-init-456";
        String email = "init.user@example.com";
        String mockJwt = createMockJwt(sub, orgId, email);

        Tenant mockTenant = Tenant.builder()
                .id(UUID.randomUUID())
                .asgardeoOrgId(orgId)
                .createdAt(Instant.now())
                .build();

        User mockUser = User.builder()
                .id(UUID.randomUUID())
                .asgardeoUuid(sub)
                .email(email)
                .lastLoginAt(Instant.now())
                .tenant(mockTenant)
                .build();

        when(userSyncService.syncUserFromJwt(eq(sub), eq(orgId), eq(email))).thenReturn(mockUser);

        mockMvc.perform(post("/api/users/init")
                        .header("X-JWT-Assertion", mockJwt)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.asgardeoUuid").value(sub))
                .andExpect(jsonPath("$.tenant.asgardeoOrgId").value(orgId));
    }

    @Test
    @DisplayName("Should return 400 Bad Request when X-JWT-Assertion header is missing")
    void testMissingJwtHeader_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 Bad Request when JWT format is invalid")
    void testInvalidJwtFormat_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("X-JWT-Assertion", "invalid-token-without-periods"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 Bad Request when 'sub' claim is missing")
    void testMissingSubClaim_ReturnsBadRequest() throws Exception {
        String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"org_id\":\"org-123\",\"email\":\"test@test.com\"}".getBytes(StandardCharsets.UTF_8));
        String token = header + "." + payload + ".sig";

        mockMvc.perform(get("/api/users/me")
                        .header("X-JWT-Assertion", token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 Bad Request when 'org_id' claim is missing")
    void testMissingOrgIdClaim_ReturnsBadRequest() throws Exception {
        String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"sub-123\",\"email\":\"test@test.com\"}".getBytes(StandardCharsets.UTF_8));
        String token = header + "." + payload + ".sig";

        mockMvc.perform(get("/api/users/me")
                        .header("X-JWT-Assertion", token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should extract email from WSO2 claim dialect URI")
    void testGetCurrentUser_WithWso2ClaimUri() throws Exception {
        String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"sub-wso2\",\"org_id\":\"org-wso2\",\"http://wso2.org/claims/emailaddress\":\"wso2@example.com\"}".getBytes(StandardCharsets.UTF_8));
        String token = header + "." + payload + ".mockSig";

        User mockUser = User.builder()
                .id(UUID.randomUUID())
                .asgardeoUuid("sub-wso2")
                .email("wso2@example.com")
                .lastLoginAt(Instant.now())
                .build();

        when(userSyncService.syncUserFromJwt(eq("sub-wso2"), eq("org-wso2"), eq("wso2@example.com"))).thenReturn(mockUser);

        mockMvc.perform(get("/api/users/me")
                        .header("X-JWT-Assertion", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("wso2@example.com"));
    }

    @Test
    @DisplayName("Should fallback to X-User-Email header when JWT lacks email claim")
    void testGetCurrentUser_WithFallbackHeader() throws Exception {
        String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"sub-fallback\",\"org_id\":\"org-fallback\"}".getBytes(StandardCharsets.UTF_8));
        String token = header + "." + payload + ".mockSig";

        User mockUser = User.builder()
                .id(UUID.randomUUID())
                .asgardeoUuid("sub-fallback")
                .email("fallback@example.com")
                .lastLoginAt(Instant.now())
                .build();

        when(userSyncService.syncUserFromJwt(eq("sub-fallback"), eq("org-fallback"), eq("fallback@example.com"))).thenReturn(mockUser);

        mockMvc.perform(get("/api/users/me")
                        .header("X-JWT-Assertion", token)
                        .header("X-User-Email", "fallback@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("fallback@example.com"));
    }
}
