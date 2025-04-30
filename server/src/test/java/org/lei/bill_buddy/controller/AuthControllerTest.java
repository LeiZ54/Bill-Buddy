package org.lei.bill_buddy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.lei.bill_buddy.DTO.UserLoginRequest;
import org.lei.bill_buddy.DTO.UserRegisterRequest;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.*;
import org.lei.bill_buddy.util.JwtUtil;
import org.lei.bill_buddy.util.VerificationCodeUtil;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtil jwtUtil;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void register_should_return_token_and_userInfo() throws Exception {
        UserRegisterRequest req = new UserRegisterRequest();
        req.setEmail("test@example.com");
        req.setPassword("123456");
        req.setGivenName("Test");
        req.setFamilyName("User");

        User saved = new User();
        saved.setId(1L);
        saved.setEmail("test@example.com");
        saved.setGivenName("Test");
        saved.setFamilyName("User");

        Mockito.when(userService.addUser(any(User.class))).thenReturn(saved);
        Mockito.when(jwtUtil.generateAuthToken("test@example.com")).thenReturn("mock-jwt");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("test@example.com")))
                .andExpect(jsonPath("$.token", is("mock-jwt")));
    }

    @Test
    void login_success() throws Exception {
        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("123456");

        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setGivenName("Test");
        user.setFamilyName("User");

        Mockito.when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        Authentication auth = Mockito.mock(Authentication.class);
        Mockito.when(auth.getPrincipal()).thenReturn(user);
        Mockito.when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        Mockito.when(jwtUtil.generateAuthToken("test@example.com")).thenReturn("mock-jwt");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("test@example.com")))
                .andExpect(jsonPath("$.token", is("mock-jwt")));
    }

    @Test
    void login_user_not_found_returns_4xx() throws Exception {
        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("no@none.com");
        req.setPassword("123");

        Mockito.when(userService.getUserByEmail("no@none.com")).thenReturn(null);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void login_wrong_password_returns_unauthorized() throws Exception {
        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("wrong-pass");

        User user = new User();
        user.setEmail("test@example.com");
        Mockito.when(userService.getUserByEmail("test@example.com")).thenReturn(user);

        Mockito.when(authenticationManager.authenticate(
                        any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @TestConfiguration
    static class MockConfig {

        @Bean
        UserService userService() {
            return Mockito.mock(UserService.class);
        }

        @Bean
        GoogleAuthService googleAuthService() {
            return Mockito.mock(GoogleAuthService.class);
        }

        @Bean
        JwtUtil jwtUtil() {
            return Mockito.mock(JwtUtil.class);
        }

        @Bean
        VerificationCodeUtil verificationCodeUtil() {
            return Mockito.mock(VerificationCodeUtil.class);
        }

        @Bean
        EmailProducer emailProducer() {
            return Mockito.mock(EmailProducer.class);
        }

        @Bean
        AuthenticationManager authenticationManager() {
            return Mockito.mock(AuthenticationManager.class);
        }
    }
}
