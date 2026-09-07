package ieeeyp.invox.user_service.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import ieeeyp.invox.user_service.entity.Tenant;
import ieeeyp.invox.user_service.entity.User;
import ieeeyp.invox.user_service.repository.TenantRepository;
import ieeeyp.invox.user_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class UserSyncIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @BeforeEach
    void cleanDb() {
        userRepository.deleteAll();
        tenantRepository.deleteAll();
    }

    private String createMockJwt(String sub, String orgId, String email) {
        String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(String.format("{\"sub\":\"%s\",\"org_id\":\"%s\",\"email\":\"%s\"}", sub, orgId, email).getBytes(StandardCharsets.UTF_8));
        return header + "." + payload + ".mockSignature";
    }

    @Test
    @DisplayName("End-to-end JIT provisioning creates Tenant and User in DB")
    void testEndToEndJitProvisioning() {
        String sub = "asgardeo-user-1";
        String orgId = "asgardeo-org-1";
        String email = "jit.user@invox.io";
        String jwt = createMockJwt(sub, orgId, email);

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-JWT-Assertion", jwt);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        String url = "http://localhost:" + port + "/api/users/me";
        ResponseEntity<User> response = restTemplate.exchange(url, HttpMethod.GET, request, User.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getAsgardeoUuid()).isEqualTo(sub);
        assertThat(response.getBody().getEmail()).isEqualTo(email);
        assertThat(response.getBody().getTenant()).isNotNull();
        assertThat(response.getBody().getTenant().getAsgardeoOrgId()).isEqualTo(orgId);

        // Verify in DB
        Optional<Tenant> savedTenant = tenantRepository.findByAsgardeoOrgId(orgId);
        assertThat(savedTenant).isPresent();

        Optional<User> savedUser = userRepository.findByAsgardeoUuid(sub);
        assertThat(savedUser).isPresent();
        assertThat(savedUser.get().getTenant().getId()).isEqualTo(savedTenant.get().getId());
    }
}
