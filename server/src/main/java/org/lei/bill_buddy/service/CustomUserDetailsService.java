package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String name) throws UsernameNotFoundException {
        log.info("Attempting to load user by email: {}", name);

        User user = userRepository.findByEmailAndDeletedFalse(name)
                .orElseThrow(() -> {
                    log.warn("User not found with email: {}", name);
                    return new AppException(ErrorCode.USER_NOT_FOUND);
                });

        log.info("User found: {}", user.getEmail());

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}
