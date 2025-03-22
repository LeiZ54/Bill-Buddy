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

    public User addUser(User user) {
        if (getUserByEmail(user.getEmail()) != null) {
            throw new RuntimeException("Email already taken!");
        }

        User newUser = new User();
        user.setUsername(user.getUsername());
        user.setEmail(user.getEmail());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        newUser.setGivenName(user.getGivenName());
        newUser.setFamilyName(user.getFamilyName());
        return userRepository.save(user);
    }

    public User updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            if (getUserByEmail(user.getEmail()) != null && !existingUser.getEmail().equals(user.getEmail())) {
                throw new RuntimeException("Email already taken!");
            }
            existingUser.setEmail(user.getEmail());
        }
        if (user.getUsername() != null && !user.getUsername().isEmpty())
            existingUser.setUsername(user.getUsername());
        if (user.getPassword() != null && !user.getPassword().isEmpty())
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getGivenName() != null && !user.getGivenName().isEmpty())
            existingUser.setGivenName(user.getGivenName());
        if (user.getFamilyName() != null && !user.getFamilyName().isEmpty())
            existingUser.setFamilyName(user.getFamilyName());
        return userRepository.save(existingUser);
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return getUserByEmail(username);
    }
}
