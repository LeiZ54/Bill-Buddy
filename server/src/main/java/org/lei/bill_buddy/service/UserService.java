package org.lei.bill_buddy.service;

import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(String username, String email, String rawPassword) {
        if (getUserByEmail(email) != null) {
            throw new RuntimeException("Email already taken!");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setProvider("local");
        user.setPassword(passwordEncoder.encode(rawPassword));
        return userRepository.save(user);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return getUserByUsername(username);
    }
}
