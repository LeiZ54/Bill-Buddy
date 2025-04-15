package org.lei.bill_buddy.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
public class GoogleAuthService {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    public GoogleIdToken.Payload verifyGoogleToken(String idTokenString) throws Exception {
        log.debug("Verifying Google ID Token...");
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), JSON_FACTORY)
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken != null) {
            log.info("Google ID Token verified successfully for user: {}", idToken.getPayload().getEmail());
            return idToken.getPayload();
        } else {
            log.warn("Google ID Token verification failed.");
            throw new AppException(ErrorCode.INVALID_GOOGLE_ID);
        }
    }
}
