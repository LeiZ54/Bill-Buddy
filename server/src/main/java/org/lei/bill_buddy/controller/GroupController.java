package org.lei.bill_buddy.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.DTO.*;
import org.lei.bill_buddy.annotation.RateLimit;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ActionType;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.enums.ObjectType;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.*;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.lei.bill_buddy.util.JwtUtil;
import org.lei.bill_buddy.util.RateLimiterUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@RateLimit
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;
    private final GroupMemberService groupMemberService;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final DtoConvertorUtil dtoConvertor;
    private final EmailProducer emailProducer;
    private final RateLimiterUtil rateLimiter;
    private final GroupDebtService groupDebtService;
    private final FriendService friendService;
    private final ActivityService activityService;

    @Value("${bill-buddy.client.url}")
    private String clientUrl;

    @PostMapping
    public ResponseEntity<?> createGroup(@Valid @RequestBody GroupCreateRequest request) {
        Group newGroup = groupService.createGroup(request.getGroupName(), request.getType(), request.getDefaultCurrency(), userService.getCurrentUser());
        return ResponseEntity.ok(dtoConvertor.convertGroupToGroupDTO(newGroup));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroup(@PathVariable Long groupId) {
        Group group = groupService.getGroupById(groupId);
        return ResponseEntity.ok(dtoConvertor.convertGroupToGroupDetailsDTO(group));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<?> updateGroup(@PathVariable Long groupId, @Valid @RequestBody GroupUpdateRequest request) {
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to update this group.");
        }
        Group updated = groupService.updateGroup(groupId, request.getNewName(), request.getNewType());
        return ResponseEntity.ok(dtoConvertor.convertGroupToGroupDTO(updated));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId) {
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to delete this group.");
        }
        groupService.deleteGroup(groupId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Group deleted"));
    }

    @GetMapping("/{groupId}/invitation-link")
    public ResponseEntity<?> inviteLink(@PathVariable Long groupId) {

        Group group = groupService.getGroupById(groupId);
        String inviteLink = generateInvitationLink(group);
        return ResponseEntity.ok(Map.of("inviteLink", inviteLink));
    }

    @PostMapping("/{groupId}/invite/friend/{friendId}")
    public ResponseEntity<?> inviteFriend(@PathVariable Long groupId, @PathVariable Long friendId) {
        Group group = groupService.getGroupById(groupId);
        User user = userService.getCurrentUser();
        if (group == null) throw new AppException(ErrorCode.GROUP_NOT_FOUND);
        if (!groupService.isMemberOfGroup(user.getId(), group.getId()))
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        if (!friendService.isFriend(user.getId(), friendId))
            throw new AppException(ErrorCode.FRIEND_RELATIONSHIP_NOT_FOUND);
        groupMemberService.addMemberToGroup(group.getId(), friendId);
        activityService.log(
                ActionType.UPDATE,
                ObjectType.GROUP,
                groupId,
                "user_invited_user_to_group",
                Map.of("inviterId", user.getId().toString(),
                        "inviteeId", friendId.toString(),
                        "groupId", group.getId().toString())
        );
        return ResponseEntity.ok("Invitation accepted. Friend: " + friendId + " Group: " + groupId);
    }

    @RateLimit(maxRequests = 1)
    @PostMapping("/{groupId}/invite")
    public ResponseEntity<?> inviteMemberByEmail(@PathVariable Long groupId, @RequestParam String email,
                                                 HttpServletRequest request) {

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }

        if (!rateLimiter.isAllowed(ip, 60)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Too many requests. Please try again later.");
        }
        Group group = groupService.getGroupById(groupId);
        String inviteLink = generateInvitationLink(group);
        EmailDTO emailDTO = new EmailDTO();
        emailDTO.setType("invite");
        emailDTO.setToEmail(email);
        emailDTO.setGroupName(group.getName());
        emailDTO.setInviteLink(inviteLink);
        emailProducer.sendEmail(emailDTO);
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

        groupMemberService.addMemberToGroup(groupId, user.getId());

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

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<?> removeMemberFromGroup(@PathVariable Long groupId, @PathVariable Long userId) {
        groupMemberService.removeMemberFromGroup(groupId, userId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Member removed from group."));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getMembersOfGroup(@PathVariable Long groupId) {
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), groupId)) {
            throw new RuntimeException("You do not have permission to view members of this group.");
        }
        List<User> userList = groupMemberService.getMembersOfGroup(groupId);
        return ResponseEntity.ok(userList.stream().map(dtoConvertor::convertUserToUserDTO));
    }

    @GetMapping("/detail")
    public ResponseEntity<?> getDetailedGroups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "") String groupName) {

        User user = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<GroupDetailsDTO> groupPage = groupService.getGroupsByUserIdAndGroupName(user.getId(), groupName, pageable)
                .map(dtoConvertor::convertGroupToGroupDetailsDTO);

        return ResponseEntity.ok(groupPage);
    }

    @GetMapping("/{groupId}/is-settled")
    public ResponseEntity<?> checkIsSettled(@PathVariable Long groupId) {
        User user = userService.getCurrentUser();
        if (!groupService.isMemberOfGroup(user.getId(), groupId)) {
            log.warn("User {} is not a member of group {}.", user.getId(), groupId);
        }
        return ResponseEntity.ok(groupDebtService.isGroupSettled(groupId));
    }

    @GetMapping
    public ResponseEntity<?> getGroups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "") String groupName) {

        User user = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groupPage = groupService.getGroupsByUserIdAndGroupName(user.getId(), groupName, pageable);

        return ResponseEntity.ok(groupPage.map(dtoConvertor::convertGroupToGroupDTO));
    }

    private String generateInvitationLink(Group group) {
        return clientUrl + "/inviteLink?token=" + jwtUtil.generateInviteToken(group.getId(), group.getName(), group.getType().name());
    }
}
