package org.lei.bill_buddy.service;

import org.springframework.transaction.annotation.Transactional;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.GroupMember;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.GroupMemberRepository;
import org.lei.bill_buddy.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class GroupService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserService userService;

    @Autowired
    public GroupService(GroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository,
                        UserService userService) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userService = userService;
    }

    public Group createGroup(String groupName, Long creatorId) {
        User creator = userService.getUserById(creatorId);
        if (creator == null) {
            throw new RuntimeException("User not found with id: " + creatorId);
        }

        Group group = new Group();
        group.setName(groupName);
        group.setCreator(creator);
        Group savedGroup = groupRepository.save(group);

        GroupMember gm = new GroupMember();
        gm.setGroup(savedGroup);
        gm.setUser(creator);
        gm.setRole("admin");
        gm.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(gm);

        return savedGroup;
    }

    @Transactional(readOnly = true)
    public Group getGroupById(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));
    }

    public Group updateGroup(Long groupId, String newName) {
        Group group = getGroupById(groupId);
        if (newName != null && !newName.isEmpty()) {
            group.setName(newName);
        }
        group.setUpdatedAt(LocalDateTime.now());
        return groupRepository.save(group);
    }

    public void deleteGroup(Long groupId) {
        Group group = getGroupById(groupId);
        groupMemberRepository.softDeleteAllByGroup(group);
        group.setDeleted(true);
        groupRepository.save(group);
    }

    @Transactional(readOnly = true)
    public List<Group> getGroupsByUserId(Long userId) {
        return groupRepository.findAllByCreatorIdOrJoinedUserId(userId);
    }

    public void addMemberToGroup(Long groupId, Long userId) {
        Group group = getGroupById(groupId);
        User user = userService.getUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        if (isMemberOfGroup(groupId, userId)) {
            throw new RuntimeException("User already in this group");
        }

        GroupMember gm = new GroupMember();
        gm.setGroup(group);
        gm.setUser(user);
        gm.setRole("member");
        gm.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(gm);
    }

    public void removeMemberFromGroup(Long groupId, Long userId) {
        Group group = getGroupById(groupId);
        User user = userService.getUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        GroupMember gm = groupMemberRepository.findByGroupAndUserAndDeletedFalse(group, user)
                .orElseThrow(() -> new RuntimeException("User is not a member of the group"));

        gm.setDeleted(true);
        groupMemberRepository.save(gm);
    }

    @Transactional(readOnly = true)
    public List<User> getMembersOfGroup(Long groupId) {
        Group group = getGroupById(groupId);
        List<GroupMember> memberList = groupMemberRepository.findAllByGroupAndDeletedFalse(group);
        return memberList.stream()
                .map(GroupMember::getUser)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateMemberRole(Long groupId, Long userId, String role) {
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

    public boolean isMemberOfGroup(Long groupId, Long userId) {
        return groupMemberRepository.existsByGroupIdAndUserIdAndDeletedFalse(groupId, userId);
    }

    public boolean isMemberAdmin(Long userId, Long groupId) {
        return groupMemberRepository.existsByUserIdAndGroupIdAndRoleAndDeletedFalse(userId, groupId, "admin");
    }
}


