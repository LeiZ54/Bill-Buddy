package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.GroupMember;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.GroupMemberRepository;
import org.lei.bill_buddy.repository.GroupRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Transactional
@RequiredArgsConstructor
@Service
public class GroupService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserService userService;

    public void groupUpdated(Group group) {
        group.setUpdatedAt(LocalDateTime.now());
        groupRepository.save(group);
        log.debug("Group updated: {}", group.getId());
    }

    public Group createGroup(String groupName, String type, Long creatorId) {
        log.info("Creating group: {} by user {}", groupName, creatorId);
        User creator = userService.getUserById(creatorId);
        if (creator == null) {
            throw new RuntimeException("User not found with id: " + creatorId);
        }

        Group group = new Group();
        group.setName(groupName);
        group.setCreator(creator);
        group.setType(type);
        Group savedGroup = groupRepository.save(group);

        GroupMember gm = new GroupMember();
        gm.setGroup(savedGroup);
        gm.setUser(creator);
        gm.setRole("admin");
        gm.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(gm);

        log.info("Group created successfully: {}", savedGroup.getId());
        return savedGroup;
    }

    @Transactional(readOnly = true)
    public Group getGroupById(Long groupId) {
        log.debug("Fetching group by ID: {}", groupId);
        return groupRepository.findByIdAndDeletedFalse(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));
    }

    public Group updateGroup(Long groupId, String newName, String newType) {
        log.info("Updating group {} with name: {}, type: {}", groupId, newName, newType);
        Group group = getGroupById(groupId);
        if (newName != null && !newName.isEmpty()) {
            group.setName(newName);
        }
        if (newType != null && !newType.isEmpty()) {
            group.setType(newType);
        }
        return groupRepository.save(group);
    }

    public void deleteGroup(Long groupId) {
        log.warn("Deleting group with id: {}", groupId);
        Group group = getGroupById(groupId);
        groupMemberRepository.softDeleteAllByGroup(group);
        group.setDeleted(true);
        groupRepository.save(group);
        log.info("Group {} marked as deleted.", groupId);
    }

    @Transactional(readOnly = true)
    public Page<Group> getGroupsByUserId(Long userId, Pageable pageable) {
        log.debug("Getting groups for user: {}", userId);
        return groupRepository.findAllByUserIdAndSortedByGroupUpdatedAt(userId, pageable);
    }

    @Transactional
    public void addMemberToGroup(Long groupId, Long userId) {
        log.info("Adding user {} to group {}", userId, groupId);
        Group group = getGroupById(groupId);
        User user = userService.getUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        if (isMemberOfGroup(userId, groupId)) {
            throw new RuntimeException("User already in this group");
        }

        GroupMember gm = new GroupMember();
        gm.setGroup(group);
        gm.setUser(user);
        gm.setRole("member");
        gm.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(gm);
        groupUpdated(group);

        log.info("User {} added to group {}", userId, groupId);
    }

    @Transactional
    public void removeMemberFromGroup(Long groupId, Long userId) {
        log.info("Removing user {} from group {}", userId, groupId);
        Group group = getGroupById(groupId);
        User user = userService.getUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        GroupMember gm = groupMemberRepository.findByGroupAndUserAndDeletedFalse(group, user)
                .orElseThrow(() -> new RuntimeException("User is not a member of the group"));

        gm.setDeleted(true);
        groupMemberRepository.save(gm);
        groupUpdated(group);

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

    @Transactional(readOnly = true)
    public List<Long> getMemberIdsByGroupId(Long groupId) {
        return groupMemberRepository.findUserIdsByGroupIdAndDeletedFalse(groupId);
    }

    @Transactional
    public void updateMemberRole(Long groupId, Long userId, String role) {
        log.info("Updating role of user {} in group {} to {}", userId, groupId, role);
        Group group = getGroupById(groupId);
        User user = userService.getUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        GroupMember gm = groupMemberRepository.findByGroupAndUserAndDeletedFalse(group, user)
                .orElseThrow(() -> new RuntimeException("User is not a member of the group"));
        gm.setRole(role);
        groupMemberRepository.save(gm);
    }

    public boolean isMemberOfGroup(Long userId, Long groupId) {
        return groupMemberRepository.existsByUserIdAndGroupIdAndDeletedFalse(userId, groupId);
    }

    public boolean isMemberAdmin(Long userId, Long groupId) {
        return groupMemberRepository.existsByUserIdAndGroupIdAndRoleAndDeletedFalse(userId, groupId, "admin");
    }
}
