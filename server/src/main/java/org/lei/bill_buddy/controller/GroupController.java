package org.lei.bill_buddy.controller;

import org.lei.bill_buddy.DTO.GroupCreateRequest;
import org.lei.bill_buddy.DTO.GroupUpdateRequest;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.GroupMember;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    @Autowired
    private GroupService groupService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody GroupCreateRequest request) {
        Group newGroup = groupService.createGroup(request.getGroupName(), userService.getCurrentUser().getId());
        return ResponseEntity.ok(newGroup);
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroup(@PathVariable Long groupId) {
        Group group = groupService.getGroupById(groupId);
        return ResponseEntity.ok(group);
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<?> updateGroup(
            @PathVariable Long groupId,
            @RequestBody GroupUpdateRequest request) {
        if (!groupService.isUserAdmin(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to update this group.");
        }
        Group updated = groupService.updateGroup(groupId, request.getNewName());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId) {
        if (!groupService.isUserAdmin(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to delete this group.");
        }
        groupService.deleteGroup(groupId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Group deleted"));
    }

    @PostMapping("/{groupId}/members/{userId}")
    public ResponseEntity<?> addMemberToGroup(
            @PathVariable Long groupId,
            @PathVariable Long userId) {
        groupService.addMemberToGroup(
                groupId,
                userId
        );
        return ResponseEntity.ok(groupService.getGroupById(groupId));
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<?> removeMemberFromGroup(
            @PathVariable Long groupId,
            @PathVariable Long userId) {
        groupService.removeMemberFromGroup(groupId, userId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Member removed from group."));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getMembersOfGroup(@PathVariable Long groupId) {
        List<User> userList = groupService.getMembersOfGroup(groupId);
        return ResponseEntity.ok(userList);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getGroupsByUser() {
        User user = userService.getCurrentUser();
        List<Group> groupList = groupService.getGroupsByUserId(user.getId());
        return ResponseEntity.ok(groupList);
    }
}
