package org.lei.bill_buddy.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.GroupCreateRequest;
import org.lei.bill_buddy.DTO.GroupDetailsDTO;
import org.lei.bill_buddy.DTO.GroupUpdateRequest;
import org.lei.bill_buddy.model.ExpenseShare;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.lei.bill_buddy.util.JwtUtil;
import org.lei.bill_buddy.util.MailSenderUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;
    private final UserService userService;
    private final ExpenseService expenseService;
    private final MailSenderUtil mailSenderUtil;
    private final JwtUtil jwtUtil;
    private final DtoConvertorUtil dtoConvertor;

    @Value("${bill-buddy.client.url}")
    private String clientUrl;

    @PostMapping
    public ResponseEntity<?> createGroup(@Valid @RequestBody GroupCreateRequest request) {
        Group newGroup = groupService.createGroup(request.getGroupName(), request.getType(), userService.getCurrentUser().getId());
        return ResponseEntity.ok(dtoConvertor.convertGroupToGroupDTO(newGroup));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroup(@PathVariable Long groupId) {
        Group group = groupService.getGroupById(groupId);
        return ResponseEntity.ok(dtoConvertor.convertGroupToGroupDTO(group));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<?> updateGroup(@PathVariable Long groupId, @Valid @RequestBody GroupUpdateRequest request) {
        if (!groupService.isMemberAdmin(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to update this group.");
        }
        Group updated = groupService.updateGroup(groupId, request.getNewName(), request.getNewType());
        return ResponseEntity.ok(dtoConvertor.convertGroupToGroupDTO(updated));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId) {
        if (!groupService.isMemberAdmin(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to delete this group.");
        }
        groupService.deleteGroup(groupId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Group deleted"));
    }

    @GetMapping("/{groupId}/invitation-link")
    public ResponseEntity<?> inviteMemberByEmail(@PathVariable Long groupId) {

        Group group = groupService.getGroupById(groupId);
        String inviteLink = generateInvitationLink(group);
        return ResponseEntity.ok(Map.of("inviteLink", inviteLink));
    }

    @PostMapping("/{groupId}/invite")
    public ResponseEntity<?> invitationLink(@PathVariable Long groupId, @RequestParam String email) throws MessagingException, IOException {

        Group group = groupService.getGroupById(groupId);
        String inviteLink = generateInvitationLink(group);
        mailSenderUtil.sendInvitationEmail(group.getName(), email, inviteLink);

        return ResponseEntity.ok("Invitation sent to " + email);
    }


    @PostMapping("/invitations/accept")
    public ResponseEntity<?> acceptInvitation(@RequestParam String token) {
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid or expired invitation token."));
        }

        Map<String, Object> inviteData = jwtUtil.getInviteTokenDetails(token);
        Long groupId = (Long) inviteData.get("groupId");

        User user = userService.getCurrentUser();

        groupService.addMemberToGroup(groupId, user.getId());

        return ResponseEntity.ok("Invitation accepted. You've joined the group!");
    }

    @GetMapping("/invitations/check")
    public ResponseEntity<?> checkInvitation(@RequestParam String token) {
        if (!jwtUtil.validateToken(token)) {
            throw new RuntimeException("Invalid or expired invitation token.");
        }
        Map<String, Object> inviteData = jwtUtil.getInviteTokenDetails(token);
        Long groupId = (Long) inviteData.get("groupId");
        return ResponseEntity.ok(Map.of("joined", groupService.isMemberOfGroup(userService.getCurrentUser().getId(), groupId)));
    }

    @PostMapping("/check-out/{groupId}")
    public ResponseEntity<?> checkOutGroup(@PathVariable Long groupId) throws JsonProcessingException {
        if (!groupService.isMemberAdmin(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to check out this group.");
        }
        expenseService.checkOutExpenseByGroupId(groupId);
        return ResponseEntity.ok("All expenses in this group were checked out");
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<?> removeMemberFromGroup(@PathVariable Long groupId, @PathVariable Long userId) {
        groupService.removeMemberFromGroup(groupId, userId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Member removed from group."));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getMembersOfGroup(@PathVariable Long groupId) {
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to view members of this group.");
        }
        List<User> userList = groupService.getMembersOfGroup(groupId);
        return ResponseEntity.ok(userList.stream().map(dtoConvertor::convertUserToUserDTO));
    }

    @GetMapping("/detail")
    public ResponseEntity<?> getDetailedGroups(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {

        User user = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groupPage = groupService.getGroupsByUserId(user.getId(), pageable);

        return ResponseEntity.ok(groupPage.map(dtoConvertor::convertGroupToGroupDetailsDTO));
    }

    @GetMapping
    public ResponseEntity<?> getGroups(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {

        User user = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groupPage = groupService.getGroupsByUserId(user.getId(), pageable);

        return ResponseEntity.ok(groupPage.map(dtoConvertor::convertGroupToGroupDTO));
    }

    private String generateInvitationLink(Group group) {
        return clientUrl + "/inviteLink?token=" + jwtUtil.generateInviteToken(group.getId(), group.getName());
    }
}
