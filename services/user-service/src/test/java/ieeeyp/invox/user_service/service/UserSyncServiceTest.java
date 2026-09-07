package ieeeyp.invox.user_service.service;

import ieeeyp.invox.user_service.entity.Tenant;
import ieeeyp.invox.user_service.entity.User;
import ieeeyp.invox.user_service.repository.TenantRepository;
import ieeeyp.invox.user_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserSyncServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserSyncService userSyncService;

    private final String testOrgId = "org-12345";
    private final String testUserUuid = "sub-67890";
    private final String testEmail = "user@invox.io";

    private Tenant existingTenant;

    @BeforeEach
    void setUp() {
        existingTenant = Tenant.builder()
                .id(UUID.randomUUID())
                .asgardeoOrgId(testOrgId)
                .createdAt(Instant.now().minusSeconds(3600))
                .build();
    }

    @Test
    @DisplayName("Should create new Tenant and new User when neither exists")
    void testSyncUser_CreatesNewTenantAndUser() {
        when(tenantRepository.findByAsgardeoOrgId(testOrgId)).thenReturn(Optional.empty());
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> {
            Tenant t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        when(userRepository.findByAsgardeoUuid(testUserUuid)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        User result = userSyncService.syncUserFromJwt(testUserUuid, testOrgId, testEmail);

        assertThat(result).isNotNull();
        assertThat(result.getAsgardeoUuid()).isEqualTo(testUserUuid);
        assertThat(result.getEmail()).isEqualTo(testEmail);
        assertThat(result.getTenant()).isNotNull();
        assertThat(result.getTenant().getAsgardeoOrgId()).isEqualTo(testOrgId);
        assertThat(result.getLastLoginAt()).isNotNull();

        verify(tenantRepository).save(any(Tenant.class));
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should reuse existing Tenant and create new User")
    void testSyncUser_ReusesTenant_CreatesNewUser() {
        when(tenantRepository.findByAsgardeoOrgId(testOrgId)).thenReturn(Optional.of(existingTenant));
        when(userRepository.findByAsgardeoUuid(testUserUuid)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userSyncService.syncUserFromJwt(testUserUuid, testOrgId, testEmail);

        assertThat(result).isNotNull();
        assertThat(result.getAsgardeoUuid()).isEqualTo(testUserUuid);
        assertThat(result.getTenant()).isEqualTo(existingTenant);

        verify(tenantRepository, never()).save(any(Tenant.class));
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should update lastLoginAt and email for existing User")
    void testSyncUser_UpdatesExistingUser() {
        Instant initialLoginTime = Instant.now().minusSeconds(7200);
        User existingUser = User.builder()
                .id(UUID.randomUUID())
                .asgardeoUuid(testUserUuid)
                .email("old-email@invox.io")
                .tenant(existingTenant)
                .lastLoginAt(initialLoginTime)
                .build();

        when(tenantRepository.findByAsgardeoOrgId(testOrgId)).thenReturn(Optional.of(existingTenant));
        when(userRepository.findByAsgardeoUuid(testUserUuid)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userSyncService.syncUserFromJwt(testUserUuid, testOrgId, testEmail);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo(testEmail);
        assertThat(result.getLastLoginAt()).isAfter(initialLoginTime);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getEmail()).isEqualTo(testEmail);
    }
}
