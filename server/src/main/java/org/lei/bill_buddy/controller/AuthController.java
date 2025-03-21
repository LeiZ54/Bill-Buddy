package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import org.lei.bill_buddy.DTO.UserGoogleLoginRequest;
import org.lei.bill_buddy.DTO.UserLoggedInDTO;
import org.lei.bill_buddy.DTO.UserLoginRequest;
import org.lei.bill_buddy.DTO.UserRegisterRequest;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.GoogleAuthService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegisterRequest request) {
        User user = userService.registerUser(request.getUsername(),
                request.getEmail(),
                request.getPassword());

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
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody UserGoogleLoginRequest request) {
        try {
            var payload = googleAuthService.verifyGoogleToken(request.getGoogleId());

            String email = payload.getEmail();
            String name = (String) payload.get("name");

            User user = userService.getUserByEmail(email);
            if (user == null) {
                user = userService.registerUser(name, email, "");
            }

            String jwtToken = jwtUtil.generateAuthToken(email);

            return ResponseEntity.ok(new UserLoggedInDTO(user.getUsername(), user.getEmail(), jwtToken));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Google authentication failed"));
        }
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(Collections.singletonMap("available", userService.getUserByEmail(email) == null));
    }
}

