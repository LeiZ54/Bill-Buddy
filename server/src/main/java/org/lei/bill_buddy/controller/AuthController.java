package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import org.lei.bill_buddy.DTO.UserLoggedInDTO;
import org.lei.bill_buddy.DTO.UserLoginRequest;
import org.lei.bill_buddy.DTO.UserRegisterRequest;
import org.lei.bill_buddy.model.User;
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
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegisterRequest request) {
        User user = userService.registerUser(request.getUsername(),
                request.getEmail(),
                request.getPassword());

        return ResponseEntity.ok(new UserLoggedInDTO(user.getUsername(), user.getEmail(), jwtUtil.generateToken(user.getUsername())));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword());
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        UserDetails principal = (UserDetails) authentication.getPrincipal();
        User loggedInUser = userService.getUserByUsername(principal.getUsername());
        return ResponseEntity.ok(new UserLoggedInDTO(loggedInUser.getUsername(), loggedInUser.getEmail(), jwtUtil.generateToken(loggedInUser.getUsername())));
    }

    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        if (userService.isUsernameTaken(username)) {
            throw new RuntimeException("Username is taken, please try again.");
        }
        return ResponseEntity.ok(Collections.singletonMap("message", "Username is not taken."));
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        if (userService.isEmailTaken(email)) {
            throw new RuntimeException("Email is taken, please try again.");
        }
        return ResponseEntity.ok(Collections.singletonMap("message", "Email is not taken."));
    }
}

