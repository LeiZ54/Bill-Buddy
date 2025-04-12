package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.GroupMember;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.GroupMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupMemberService {
    private final GroupMemberRepository groupMemberRepository;
    private final UserService userService;
    private final GroupService groupService;
    private final ExpenseService expenseService;

    @Transactional
    public void addMemberToGroup(Long groupId, Long userId) {
        log.info("Adding user {} to group {}", userId, groupId);
        Group group = groupService.getGroupById(groupId);
        User user = userService.getUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        if (groupService.isMemberOfGroup(userId, groupId)) {
            throw new RuntimeException("User already in this group");
        }

        GroupMember gm = new GroupMember();
        gm.setGroup(group);
        gm.setUser(user);
        gm.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(gm);
        groupService.groupUpdated(group);

        log.info("User {} added to group {}", userId, groupId);
    }

    @Transactional
    public void removeMemberFromGroup(Long groupId, Long userId) {
        log.info("Removing user {} from group {}", userId, groupId);
        Group group = groupService.getGroupById(groupId);
        User user = userService.getUserById(userId);
        if (user == null) {
            log.warn("User not found with id: {}", userId);
            throw new RuntimeException("User not found with id: " + userId);
        }

        GroupMember gm = groupMemberRepository.findByGroupAndUserAndDeletedFalse(group, user)
                .orElseThrow(() -> new RuntimeException("User is not a member of the group"));

        if (expenseService.hasActiveExpensesInGroup(groupId, userId)) {
            log.warn("User {} has expense in group {}", userId, groupId);
            throw new RuntimeException("This member cannot be removed because there are active expenses for this member.");
        }
        gm.setDeleted(true);
        groupMemberRepository.save(gm);
        groupService.groupUpdated(group);

        log.info("User {} removed from group {}", userId, groupId);
    }

    @Transactional(readOnly = true)
    public List<User> getMembersOfGroup(Long groupId) {
        log.debug("Getting members of group {}", groupId);
        List<GroupMember> memberList = groupMemberRepository.findAllByGroupIdAndDeletedFalse(groupId);
        return memberList.stream()
                .map(GroupMember::getUser)
                .collect(Collectors.toList());
    }
}
