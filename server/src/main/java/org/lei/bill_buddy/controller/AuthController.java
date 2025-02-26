package org.lei.bill_buddy.controller;

import org.lei.bill_buddy.DTO.LoggedInUserDTO;
import org.lei.bill_buddy.DTO.UserLoginDTO;
import org.lei.bill_buddy.DTO.UserRegisterDTO;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<LoggedInUserDTO> register(@RequestBody UserRegisterDTO userRegisterDTO) {
        User user = userService.registerUser(userRegisterDTO.getUsername(), userRegisterDTO.getPassword(), userRegisterDTO.getEmail());
        return ResponseEntity.ok(new LoggedInUserDTO(user.getUsername(), user.getEmail(), jwtUtil.generateToken(user.getUsername())));
    }

    @PostMapping("/login")
    public ResponseEntity<LoggedInUserDTO> login(@RequestBody UserLoginDTO userLoginDTO) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userLoginDTO.getUsername(), userLoginDTO.getPassword())
        );

        User user = userService.getUserByUsername(userLoginDTO.getUsername());
        return ResponseEntity.ok(new LoggedInUserDTO(user.getUsername(), user.getEmail(), jwtUtil.generateToken(user.getUsername())));
    }
}

