package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User addUser(User user) {
        log.info("Attempting to register user with email: {}", user.getEmail());
        if (getUserByEmail(user.getEmail()) != null) {
            log.warn("Email already exists: {}", user.getEmail());
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        log.info("User registered successfully with email: {}", savedUser.getEmail());
        return savedUser;
    }

    public User updateUser(Long id, User user) {
        log.info("Attempting to update user with id: {}", id);
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User not found for id: {}", id);
                    return new AppException(ErrorCode.USER_NOT_FOUND);
                });

        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            if (getUserByEmail(user.getEmail()) != null && !existingUser.getEmail().equals(user.getEmail())) {
                log.warn("Email already taken during update: {}", user.getEmail());
                throw new RuntimeException("Email already taken!");
            }
            existingUser.setEmail(user.getEmail());
        }

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        if (user.getGivenName() != null && !user.getGivenName().isEmpty()) {
            existingUser.setGivenName(user.getGivenName());
        }

        if (user.getFamilyName() != null && !user.getFamilyName().isEmpty()) {
            existingUser.setFamilyName(user.getFamilyName());
        }

        User updatedUser = userRepository.save(existingUser);
        log.info("User updated successfully with id: {}", updatedUser.getId());
        return updatedUser;
    }

    public List<User> searchUsers(String keyword) {
        log.debug("Searching users with keyword: {}", keyword);
        return userRepository.findByEmailContainingIgnoreCaseAndDeletedFalse(keyword);
    }

    public List<User> getUsersByIds(List<Long> ids) {
        log.debug("Fetching users by ids: {}", ids);
        return userRepository.findByIdInAndDeletedFalse(ids);
    }

    public User getUserById(Long id) {
        log.debug("Fetching user by id: {}", id);
        return userRepository.findByIdAndDeletedFalse(id).orElse(null);
    }

    public User getUserByEmail(String email) {
        log.debug("Fetching user by email: {}", email);
        return userRepository.findByEmailAndDeletedFalse(email).orElse(null);
    }

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.debug("Fetching current authenticated user by email: {}", email);
        return getUserByEmail(email);
    }
}
