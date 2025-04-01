package org.lei.bill_buddy.controller;

import jakarta.mail.MessagingException;
import org.lei.bill_buddy.DTO.GroupCreateRequest;
import org.lei.bill_buddy.DTO.GroupDetailsDTO;
import org.lei.bill_buddy.DTO.GroupUpdateRequest;
import org.lei.bill_buddy.model.ExpenseShare;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.JwtUtil;
import org.lei.bill_buddy.util.MailSenderUtil;
import org.springframework.beans.factory.annotation.Autowired;
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
public class GroupController {
    @Autowired
    private GroupService groupService;

    @Autowired
    private UserService userService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private MailSenderUtil mailSenderUtil;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${bill-buddy.client.url}")
    private String clientUrl;

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody GroupCreateRequest request) {
        Group newGroup = groupService.createGroup(
                request.getGroupName(),
                request.getType(),
                userService.getCurrentUser().getId());
        return ResponseEntity.ok(groupService.convertGroupToGroupDTO(newGroup));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroup(@PathVariable Long groupId) {
        Group group = groupService.getGroupById(groupId);
        return ResponseEntity.ok(groupService.convertGroupToGroupDTO(group));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<?> updateGroup(
            @PathVariable Long groupId,
            @RequestBody GroupUpdateRequest request) {
        if (!groupService.isMemberAdmin(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to update this group.");
        }
        Group updated = groupService.updateGroup(
                groupId,
                request.getNewName(),
                request.getNewType());
        return ResponseEntity.ok(groupService.convertGroupToGroupDTO(updated));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId) {
        if (!groupService.isMemberAdmin(userService.getCurrentUser().getId(), groupId)) {
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

        mailSenderUtil.sendInvitationEmail(group.getName(), email, inviteLink);

        return ResponseEntity.ok("Invitation sent to " + email);
    }


    @PostMapping("/invitations/accept")
    public ResponseEntity<?> acceptInvitation(@RequestParam String token) {
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
        return ResponseEntity.ok(userList.stream().map(user -> userService.convertUserToUserDTO(user)));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyGroups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        User user = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groupPage = groupService.getGroupsByUserId(user.getId(), pageable);

        return ResponseEntity.ok(groupPage.map(this::convertGroupToGroupDetailsDTO));
    }

    public GroupDetailsDTO convertGroupToGroupDetailsDTO(Group group) {
        Map<Long, BigDecimal> balances = new HashMap<>();
        Map<Long, String> userIdToUsername = new HashMap<>();
        Long currentUserId = userService.getCurrentUser().getId();

        for (ExpenseShare share : expenseService.getExpenseSharesByGroupId(group.getId())) {
            Long payerId = share.getExpense().getPayer().getId();
            Long userId = share.getUser().getId();
            BigDecimal amount = share.getShareAmount();

            if (payerId.equals(currentUserId) && !userId.equals(currentUserId)) {
                balances.merge(userId, amount, BigDecimal::add);
                userIdToUsername.putIfAbsent(userId, share.getUser().getUsername());
            } else if (userId.equals(currentUserId) && !payerId.equals(currentUserId)) {
                balances.merge(payerId, amount.negate(), BigDecimal::add);
                userIdToUsername.putIfAbsent(payerId, share.getExpense().getPayer().getUsername());
            }
        }

        Map<String, BigDecimal> owesCurrentUser = new HashMap<>();
        Map<String, BigDecimal> currentUserOwes = new HashMap<>();

        for (Map.Entry<Long, BigDecimal> entry : balances.entrySet()) {
            String username = userIdToUsername.get(entry.getKey());
            BigDecimal balance = entry.getValue();

            if (balance.compareTo(BigDecimal.ZERO) > 0) {
                owesCurrentUser.put(username, balance);
            } else if (balance.compareTo(BigDecimal.ZERO) < 0) {
                currentUserOwes.put(username, balance.abs());
            }
        }

        GroupDetailsDTO dto = new GroupDetailsDTO();
        dto.setGroupId(group.getId());
        dto.setGroupName(group.getName());
        dto.setOwesCurrentUser(owesCurrentUser);
        dto.setCurrentUserOwes(currentUserOwes);
        return dto;
    }

}
