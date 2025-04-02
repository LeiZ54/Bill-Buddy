package org.lei.bill_buddy.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("#{${jwt.expiration}}")
    private long jwtExpirationTime;

    @Value("#{${invitation.jwt.expiration}}")
    private long inviteTokenExpirationTime;

    @Value("#{${reset-password.jwt.expiration}}")
    private long resetPasswordTokenExpiration;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    private String generateToken(String subject, Map<String, Object> claims, long duration) {
        return Jwts.builder()
                .subject(subject)
                .claims(claims)  // 添加额外的 claims（如 email, groupId）
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + duration))
                .signWith(secretKey)
                .compact();
    }

    public String generateAuthToken(String email) {
        return generateToken("Authorization", Map.of("email", email), jwtExpirationTime);
    }

    public String generateInviteToken(Long groupId, String groupName) {
        return generateToken("Invitation", Map.of("groupId", groupId, "groupName", groupName), inviteTokenExpirationTime);
    }

    public String generateResetPasswordToken(String email) {
        return generateToken("ResetPassword", Map.of("email", email), resetPasswordTokenExpiration);
    }

    private Claims parseClaims(String token) {
        Jws<Claims> claimsJws = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
        return claimsJws.getPayload();
    }

    public String getEmailFromToken(String token) {
        return parseClaims(token).get("email", String.class);
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    public Map<String, Object> getInviteTokenDetails(String token) {
        Claims claims = parseClaims(token);
        return Map.of(
                "groupId", claims.get("groupId", Long.class),
                "groupName", claims.get("groupName", String.class)
        );
    }
}
