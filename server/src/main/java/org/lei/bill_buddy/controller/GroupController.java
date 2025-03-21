package org.lei.bill_buddy.controller;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.mail.MessagingException;
import org.lei.bill_buddy.DTO.GroupCreateRequest;
import org.lei.bill_buddy.DTO.GroupUpdateRequest;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.MailService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    @Autowired
    private GroupService groupService;

    @Autowired
    private UserService userService;

    @Autowired
    private MailService mailService;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${bill-buddy.client.url}")
    private String clientUrl;

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

    @PostMapping("/{groupId}/invite")
    public ResponseEntity<?> inviteMemberByEmail(
            @PathVariable Long groupId,
            @RequestParam String email
    ) throws MessagingException, IOException {

        Group group = groupService.getGroupById(groupId);

        String token = jwtUtil.generateInviteToken(email, groupId);
        String inviteLink = clientUrl + "/accept-invitation?token=" + token;

        mailService.sendInvitationEmail(group.getName(), email, inviteLink);

        return ResponseEntity.ok("Invitation sent to " + email);
    }


    @GetMapping("/invitations/accept")
    public ResponseEntity<?> acceptInvitation(@RequestParam String token) {
        try {
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid or expired invitation token."));
            }

            Map<String, Object> inviteData = jwtUtil.getInviteTokenDetails(token);
            String email = (String) inviteData.get("email");
            Long groupId = (Long) inviteData.get("groupId");

            User user = userService.getUserByEmail(email);
            if (user == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "User not found. Please register first."));
            }

            groupService.addMemberToGroup(groupId, user.getId());

            return ResponseEntity.ok("Invitation accepted. You've joined the group!");
        } catch (ExpiredJwtException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invitation link has expired."));
        } catch (JwtException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid invitation token."));
        }
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
