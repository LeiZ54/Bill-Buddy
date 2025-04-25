package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.UserLoggedInDTO;
import org.lei.bill_buddy.DTO.UserUpdateAvatarRequest;
import org.lei.bill_buddy.DTO.UserUpdateRequest;
import org.lei.bill_buddy.annotation.RateLimit;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.lei.bill_buddy.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RateLimit
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final DtoConvertorUtil dtoConvertor;
    private final JwtUtil jwtUtil;

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        if (!Objects.equals(id, userService.getCurrentUser().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN, "You do not have permission to update this User");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setGivenName(request.getGivenName());
        user.setFamilyName(request.getFamilyName());
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(new UserLoggedInDTO(
                updatedUser.getId(),
                updatedUser.getAvatar(),
                updatedUser.getFullName(),
                updatedUser.getGivenName(),
                updatedUser.getFamilyName(),
                updatedUser.getEmail(),
                jwtUtil.generateAuthToken(updatedUser.getEmail())));
    }

    @PutMapping("/avatar/{id}")
    public ResponseEntity<?> updateUserAvatar(@PathVariable Long id, @Valid @RequestBody UserUpdateAvatarRequest request) {
        if (!Objects.equals(id, userService.getCurrentUser().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN, "You do not have permission to update this User");
        }
        User user = new User();
        user.setAvatar(request.getAvatar());
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(new UserLoggedInDTO(
                updatedUser.getId(),
                updatedUser.getAvatar(),
                updatedUser.getFullName(),
                updatedUser.getGivenName(),
                updatedUser.getFamilyName(),
                updatedUser.getEmail(),
                jwtUtil.generateAuthToken(updatedUser.getEmail())));

    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(userService.searchUsers(keyword).stream().map(dtoConvertor::convertUserToUserDTO));
    }
}
