package org.lei.bill_buddy.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class VerificationCodeUtil {
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final Map<String, Long> expirationTimes = new ConcurrentHashMap<>();

    @Value("#{${reset-password.code.expiration}}")
    private long codeExpirationMillis;

    public boolean verifyCode(String email, String code) {
        String stored = verificationCodes.get(email);
        Long expiration = expirationTimes.get(email);

        if (stored == null || expiration == null || System.currentTimeMillis() > expiration) {
            verificationCodes.remove(email);
            expirationTimes.remove(email);
            return false;
        }

        return stored.equals(code);
    }

    public String generateCode(String email) {
        String code = String.format("%06d", new Random().nextInt(1000000));
        verificationCodes.put(email, code);
        expirationTimes.put(email, System.currentTimeMillis() + codeExpirationMillis);
        return code;
    }
}
