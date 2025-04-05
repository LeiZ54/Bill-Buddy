package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.UserUpdateRequest;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final DtoConvertorUtil dtoConvertor;

    @PostMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        if (!Objects.equals(id, userService.getCurrentUser().getId())) {
            throw new RuntimeException("You do not have permission to update this user.");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setGivenName(request.getGivenName());
        user.setFamilyName(request.getFamilyName());
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(dtoConvertor.convertUserToUserDTO(updatedUser));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(userService.searchUsers(keyword).stream().map(dtoConvertor::convertUserToUserDTO));
    }
}
