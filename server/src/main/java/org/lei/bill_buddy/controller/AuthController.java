package org.lei.bill_buddy.controller;

import org.lei.bill_buddy.DTO.UserLoggedInDTO;
import org.lei.bill_buddy.DTO.UserLoginDTO;
import org.lei.bill_buddy.DTO.UserRegisterDTO;
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
    public ResponseEntity<?> register(@RequestBody UserRegisterDTO request) {
        User user = userService.registerUser(request.getUsername(),
                request.getEmail(),
                request.getPassword());

        return ResponseEntity.ok(new UserLoggedInDTO(user.getUsername(), user.getEmail(), jwtUtil.generateToken(user.getUsername())));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDTO request) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword());
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        UserDetails principal = (UserDetails) authentication.getPrincipal();
        User loggedInUser = userService.getUserByUsername(principal.getUsername());
        return ResponseEntity.ok(new UserLoggedInDTO(loggedInUser.getUsername(), loggedInUser.getEmail(), jwtUtil.generateToken(loggedInUser.getUsername())));
    }
}

