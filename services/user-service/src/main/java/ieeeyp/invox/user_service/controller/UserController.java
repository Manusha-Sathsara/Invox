package ieeeyp.invox.user_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ieeeyp.invox.user_service.entity.User;
import ieeeyp.invox.user_service.service.UserSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserSyncService userSyncService;
    private final ObjectMapper objectMapper;

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(
            @RequestHeader(value = "X-JWT-Assertion", required = true) String backendJwt,
            @RequestHeader(value = "X-User-Email", required = false) String clientEmail) {
        User syncedUser = processJwtAndSyncUser(backendJwt, clientEmail);
        return ResponseEntity.ok(syncedUser);
    }

    @PostMapping("/init")
    public ResponseEntity<User> initCurrentUser(
            @RequestHeader(value = "X-JWT-Assertion", required = true) String backendJwt,
            @RequestHeader(value = "X-User-Email", required = false) String clientEmail) {
        User syncedUser = processJwtAndSyncUser(backendJwt, clientEmail);
        return ResponseEntity.ok(syncedUser);
    }

    private User processJwtAndSyncUser(String backendJwt, String fallbackEmail) {
        if (backendJwt == null || backendJwt.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-JWT-Assertion header must not be empty");
        }

        // Split JWT into Header, Payload, Signature
        String[] jwtParts = backendJwt.trim().split("\\.");
        if (jwtParts.length < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JWT format in X-JWT-Assertion header");
        }

        try {
            // Decode payload (the second part) using Base64 URL decoder
            byte[] decodedBytes = Base64.getUrlDecoder().decode(jwtParts[1]);
            String payloadJson = new String(decodedBytes, StandardCharsets.UTF_8);

            // Parse payload JSON using Jackson ObjectMapper
            JsonNode rootNode = objectMapper.readTree(payloadJson);
            log.debug("Decoded JWT payload: {}", payloadJson);

            // Extract claims safely
            String sub = rootNode.path("sub").asText(null);
            String orgId = rootNode.path("org_id").asText(null);
            String email = extractEmail(rootNode);

            if (sub == null || sub.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required claim 'sub' in JWT assertion");
            }

            if (orgId == null || orgId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required claim 'org_id' in JWT assertion");
            }

            // Fallback to client-provided email header if JWT claims don't include it
            if ((email == null || email.isBlank()) && fallbackEmail != null && !fallbackEmail.isBlank() && fallbackEmail.contains("@")) {
                email = fallbackEmail.trim();
                log.info("Using fallback X-User-Email header for user {}: {}", sub, email);
            }

            return userSyncService.syncUserFromJwt(sub, orgId, email);

        } catch (IllegalArgumentException e) {
            log.error("Failed to Base64 decode JWT payload", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed Base64 in X-JWT-Assertion header", e);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse JWT payload JSON", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed JSON in JWT assertion payload", e);
        }
    }

    private String extractEmail(JsonNode rootNode) {
        String[] claimKeys = {
                "email",
                "http://wso2.org/claims/emailaddress",
                "mail",
                "email_address",
                "preferred_username",
                "http://wso2.org/claims/username",
                "username"
        };
        for (String key : claimKeys) {
            if (rootNode.hasNonNull(key)) {
                String val = rootNode.get(key).asText();
                if (val != null && !val.isBlank() && val.contains("@")) {
                    return val.trim();
                }
            }
        }
        return null;
    }
}