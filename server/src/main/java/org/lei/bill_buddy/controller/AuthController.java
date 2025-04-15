package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.*;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.EmailProducer;
import org.lei.bill_buddy.service.GoogleAuthService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.JwtUtil;
import org.lei.bill_buddy.util.VerificationCodeUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final GoogleAuthService googleAuthService;
    private final JwtUtil jwtUtil;
    private final VerificationCodeUtil verificationCodeUtil;
    private final PasswordEncoder passwordEncoder;
    private final EmailProducer emailProducer;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid UserRegisterRequest request) {
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setGivenName(request.getGivenName());
        user.setFamilyName(request.getFamilyName());
        user = userService.addUser(user);

        return ResponseEntity.ok(new UserLoggedInDTO(
                user.getId(),
                user.getFullName(),
                user.getGivenName(),
                user.getFamilyName(),
                user.getEmail(),
                jwtUtil.generateAuthToken(user.getEmail())));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid UserLoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword());
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        UserDetails principal = (UserDetails) authentication.getPrincipal();
        User loggedInUser = userService.getUserByEmail(principal.getUsername());
        return ResponseEntity.ok(new UserLoggedInDTO(
                loggedInUser.getId(),
                loggedInUser.getFullName(),
                loggedInUser.getGivenName(),
                loggedInUser.getFamilyName(),
                loggedInUser.getEmail(),
                jwtUtil.generateAuthToken(loggedInUser.getEmail())));
    }

    @PostMapping("/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody @Valid UserGoogleLoginRequest request) throws Exception {
        var payload = googleAuthService.verifyGoogleToken(request.getGoogleId());

        String email = payload.getEmail();
        String givenName = (String) payload.get("given_name");
        String familyName = (String) payload.get("family_name");

        User user = userService.getUserByEmail(email);
        if (user == null) {
            user = new User();
            user.setPassword("");
            user.setEmail(email);
            user.setGivenName(givenName);
            user.setFamilyName(familyName);
            user = userService.addUser(user);
        }

        String jwtToken = jwtUtil.generateAuthToken(email);

        return ResponseEntity.ok(new UserLoggedInDTO(
                user.getId(),
                user.getFullName(),
                user.getGivenName(),
                user.getFamilyName(),
                user.getEmail(),
                jwtToken));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        EmailDTO emailDTO = new EmailDTO();
        emailDTO.setType("verify");
        emailDTO.setToEmail(user.getEmail());
        emailDTO.setGivenName(user.getGivenName());
        emailDTO.setCode(verificationCodeUtil.generateCode(user.getEmail()));
        emailProducer.sendEmail(emailDTO);

        return ResponseEntity.ok("Verification code sent to your email.");
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody @Valid VerifyCodeRequest request) {
        boolean valid = verificationCodeUtil.verifyCode(request.getEmail(), request.getCode());
        if (!valid) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired code"));
        }
        String resetPasswordToken = jwtUtil.generateResetPasswordToken(request.getEmail());
        return ResponseEntity.ok(Map.of("token", resetPasswordToken));
    }

    @PostMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody @Valid UserUpdatePasswordRequest request) {
        User user = userService.getCurrentUser();
        if (passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            String resetPasswordToken = jwtUtil.generateResetPasswordToken(user.getEmail());
            return ResponseEntity.ok(Map.of("token", resetPasswordToken));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Password is incorrect."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        String email = jwtUtil.getEmailFromToken(request.getToken());
        User user = userService.getUserByEmail(email);
        user.setPassword(request.getNewPassword());
        userService.updateUser(user.getId(), user);
        return ResponseEntity.ok("Password updated successfully.");
    }


    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(Collections.singletonMap("available", userService.getUserByEmail(email) == null));
    }

    @GetMapping("/check-token")
    public ResponseEntity<?> checkToken(@RequestParam String token) {
        return ResponseEntity.ok(jwtUtil.validateToken(token));
    }
}

