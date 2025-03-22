package org.lei.bill_buddy.controller;

import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import org.lei.bill_buddy.DTO.*;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.GoogleAuthService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.JwtUtil;
import org.lei.bill_buddy.util.MailSenderUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private GoogleAuthService googleAuthService;

    @Autowired
    private MailSenderUtil mailSenderUtil;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${bill-buddy.client.url}")
    private String clientUrl;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegisterRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setGivenName(request.getGivenName());
        user.setFamilyName(request.getFamilyName());
        user = userService.addUser(user);

        return ResponseEntity.ok(new UserLoggedInDTO(user.getUsername(), user.getEmail(), jwtUtil.generateAuthToken(user.getEmail())));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword());
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        UserDetails principal = (UserDetails) authentication.getPrincipal();
        User loggedInUser = userService.getUserByEmail(principal.getUsername());
        return ResponseEntity.ok(new UserLoggedInDTO(loggedInUser.getUsername(), loggedInUser.getEmail(), jwtUtil.generateAuthToken(loggedInUser.getEmail())));
    }

    @PostMapping("/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody UserGoogleLoginRequest request) throws Exception {
        var payload = googleAuthService.verifyGoogleToken(request.getGoogleId());

        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String givenName = (String) payload.get("given_name");
        String familyName = (String) payload.get("family_name");

        User user = userService.getUserByEmail(email);
        if (user == null) {
            user = new User();
            user.setUsername(name);
            user.setEmail(email);
            user.setGivenName(givenName);
            user.setFamilyName(familyName);
            user = userService.addUser(user);
        }

        String jwtToken = jwtUtil.generateAuthToken(email);

        return ResponseEntity.ok(new UserLoggedInDTO(user.getUsername(), user.getEmail(), jwtToken));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) throws MessagingException, IOException {
        User user = userService.getUserByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        String token = jwtUtil.generateResetPasswordToken(email);
        String resetLink = clientUrl + "/reset-password?token=" + token;

        mailSenderUtil.sendPasswordResetEmail(user.getUsername(), email, resetLink);
        return ResponseEntity.ok("Reset link sent to your email.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
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
}

