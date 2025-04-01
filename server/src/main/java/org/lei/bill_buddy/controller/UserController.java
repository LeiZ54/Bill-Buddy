package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import org.lei.bill_buddy.DTO.UserUpdateRequest;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Value("${bill-buddy.client.url}")
    private String clientUrl;

    @PostMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        if (!Objects.equals(id, userService.getCurrentUser().getId())) {
            throw new RuntimeException("You do not have permission to update this user.");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setGivenName(request.getGivenName());
        user.setFamilyName(request.getFamilyName());
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(userService.convertUserToUserDTO(updatedUser));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(userService.searchUsers(keyword).stream().map(u -> userService.convertUserToUserDTO(u)));
    }
}
