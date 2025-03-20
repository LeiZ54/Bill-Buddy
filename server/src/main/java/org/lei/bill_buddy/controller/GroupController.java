package org.lei.bill_buddy.controller;

import jakarta.mail.MessagingException;
import org.lei.bill_buddy.DTO.GroupCreateRequest;
import org.lei.bill_buddy.DTO.GroupUpdateRequest;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.Invitation;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.InvitationRepository;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.MailService;
import org.lei.bill_buddy.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    @Autowired
    private GroupService groupService;

    @Autowired
    private UserService userService;

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private MailService mailService;

    @Value("${bill-buddy.service.url}")
    private String url;

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
        String token = UUID.randomUUID().toString().replace("-", "");

        Group group = groupService.getGroupById(groupId);
        Invitation inv = new Invitation();
        inv.setToken(token);
        inv.setGroupId(groupId);
        inv.setInviteEmail(email);
        inv.setUsed(false);
        invitationRepository.save(inv);

        String inviteLink = url + "api/groups/invitations/accept?token=" + token;
        mailService.sendInvitationEmail(group.getName(), email, inviteLink);

        return ResponseEntity.ok("Invitation sent to " + email);
    }

    @GetMapping("/invitations/accept")
    public ResponseEntity<?> acceptInvitation(@RequestParam String token) {
        Invitation inv = invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        if (inv.isUsed()) {
            return ResponseEntity.badRequest().body("Invitation is already used");
        }
        Long userId = userService.getUserByEmail(inv.getInviteEmail()).getId();
        groupService.addMemberToGroup(inv.getGroupId(), userId);

        inv.setUsed(true);
        invitationRepository.save(inv);

        return ResponseEntity.ok("Invitation accepted. You've joined the group!");
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
