package org.lei.bill_buddy.service;

import org.springframework.transaction.annotation.Transactional;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.GroupMember;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.GroupMemberRepository;
import org.lei.bill_buddy.repository.GroupRepository;
import org.lei.bill_buddy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class GroupService {
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Autowired
    public GroupService(GroupRepository groupRepository,
                        UserRepository userRepository,
                        GroupMemberRepository groupMemberRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    public Group createGroup(String groupName, Long creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + creatorId));

        Group group = new Group();
        group.setName(groupName);
        group.setCreatedBy(creator);
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
        groupMemberRepository.deleteAllByGroup(group);
        groupRepository.delete(group);
    }

    @Transactional(readOnly = true)
    public List<Group> getGroupsByUserId(Long userId) {
        return groupRepository.findAllByCreatedByIdOrJoinedUserId(userId);
    }

    public void addMemberToGroup(Long groupId, Long userId) {
        Group group = getGroupById(groupId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        boolean exists = groupMemberRepository.existsByGroupAndUser(group, user);
        if (exists) {
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        GroupMember gm = groupMemberRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new RuntimeException("User is not a member of the group"));

        groupMemberRepository.delete(gm);
    }

    @Transactional(readOnly = true)
    public List<User> getMembersOfGroup(Long groupId) {
        Group group = getGroupById(groupId);
        List<GroupMember> memberList = groupMemberRepository.findAllByGroup(group);
        return memberList.stream()
                .map(GroupMember::getUser)
                .collect(Collectors.toList());
    }

    public boolean isUserAdmin(Long userId, Long groupId) {
        return groupMemberRepository.existsByUserIdAndGroupIdAndRole(userId, groupId, "admin");
    }
}


