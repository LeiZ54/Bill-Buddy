package org.lei.bill_buddy.controller;

import org.lei.bill_buddy.DTO.UserDTO;
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
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        if (!Objects.equals(id, userService.getCurrentUser().getId())) {
            throw new RuntimeException("You do not have permission to update this user.");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setGivenName(request.getGivenName());
        user.setFamilyName(request.getFamilyName());
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(convertUserToUserDTO(updatedUser));
    }

    private UserDTO convertUserToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setGivenName(user.getGivenName());
        dto.setFamilyName(user.getFamilyName());
        return dto;
    }
}
