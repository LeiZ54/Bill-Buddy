package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ActionType;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.enums.ObjectType;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.GroupMember;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.GroupMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupMemberService {
    private final GroupMemberRepository groupMemberRepository;
    private final UserService userService;
    private final GroupService groupService;
    private final GroupDebtService groupDebtService;
    private final GroupDeleteService groupDeleteService;
    private final ExpenseService expenseService;
    private final FriendService friendService;
    private final ActivityService activityService;

    @Transactional
    public void addMemberToGroup(Long groupId, Long userId) {
        log.info("Adding user {} to group {}", userId, groupId);
        Group group = groupService.getGroupById(groupId);
        if (group == null) {
            log.warn("Can not add member to group {}, because it does not exit", groupId);
            throw new AppException(ErrorCode.GROUP_NOT_FOUND);
        }
        User user = userService.getUserById(userId);
        if (user == null) {
            log.warn("User {} does not exist", userId);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        if (groupService.isMemberOfGroup(userId, groupId)) {
            log.warn("User {} is already member of group {}", userId, groupId);
            throw new AppException(ErrorCode.ALREADY_IN_GROUP);
        }

        GroupMember gm = new GroupMember();
        gm.setGroup(group);
        gm.setUser(user);
        gm.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(gm);

        activityService.log(
                ActionType.UPDATE,
                ObjectType.GROUP,
                groupId,
                "user_joined_group",
                Map.of(
                        "groupId", groupId.toString(),
                        "userId", userId.toString()
                )
        );

        List<User> existingMembers = getMembersOfGroup(groupId).stream()
                .filter(member -> !member.getId().equals(userId))
                .toList();
        friendService.addFriends(user, existingMembers);
        groupDebtService.addGroupDebts(group, user, existingMembers);
        groupService.groupUpdated(groupId);

        log.info("User {} added to group {}", userId, groupId);
    }

    @Transactional
    public void removeMemberFromGroup(Long groupId, Long userId) {
        log.info("Removing user {} from group {}", userId, groupId);
        User user = userService.getUserById(userId);
        if (user == null) {
            log.warn("User not found with id: {}", userId);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        GroupMember gm = groupMemberRepository.findByGroupIdAndUserIdAndDeletedFalse(groupId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_A_MEMBER, "This user is not a member of this group"));

        if (expenseService.hasActiveExpensesInGroup(groupId, userId)) {
            log.warn("User {} has expense in group {}", userId, groupId);
            throw new AppException(ErrorCode.MEMBER_CAN_NOT_BE_REMOVED, "Member can not be removed because there are expenses related to this member.");
        }
        gm.setDeleted(true);
        groupMemberRepository.save(gm);
        Set<Long> memberIds = groupService.getAllMemberIdsOfGroup(groupId);

        if (memberIds == null || memberIds.isEmpty()) groupDeleteService.deleteGroup(groupId);
        activityService.log(
                ActionType.UPDATE,
                ObjectType.GROUP,
                groupId,
                "user_leaved_group",
                Map.of(
                        "groupId", groupId.toString(),
                        "userId", userId.toString()
                )
        );

        groupService.groupUpdated(groupId);

        log.info("User {} removed from group {}", userId, groupId);
    }

    @Transactional(readOnly = true)
    public List<User> getMembersOfGroup(Long groupId) {
        log.debug("Getting members of group {}", groupId);
        Group group = groupService.getGroupById(groupId);
        if (group == null) {
            log.warn("Can not get members of group {}, because it does not exit", groupId);
            throw new AppException(ErrorCode.GROUP_NOT_FOUND);
        }
        List<GroupMember> memberList = groupMemberRepository.findAllByGroupIdAndDeletedFalse(groupId);
        return memberList.stream()
                .map(GroupMember::getUser)
                .collect(Collectors.toList());
    }
}
