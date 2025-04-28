package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.*;
import org.lei.bill_buddy.enums.Currency;
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
import java.util.*;

@Slf4j
@Transactional
@RequiredArgsConstructor
@Service
public class GroupService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ActivityService activityService;
    private final UserService userService;

    public void groupUpdated(Long groupId) {
        Group group = getGroupById(groupId);
        group.setUpdatedAt(LocalDateTime.now());
        groupRepository.save(group);
        log.debug("Group updated: {}", group.getId());
    }

    public Group createGroup(String groupName, String typeStr, String defaultCurrency, User creator) {
        log.info("Creating group: {} by user {}", groupName, creator.getId());
        Group group = new Group();
        group.setName(groupName);
        group.setCreator(creator);

        GroupType type;
        try {
            type = GroupType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown group type '{}', defaulting to OTHER in group creating", typeStr);
            type = GroupType.OTHER;
        }
        group.setType(type);

        Currency currencyEnum;
        try {
            currencyEnum = Currency.valueOf(defaultCurrency.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unsupported currency '{}', defaulting to USD in group creating", defaultCurrency);
            currencyEnum = Currency.USD;
        }
        group.setDefaultCurrency(currencyEnum);
        Group savedGroup = groupRepository.save(group);

        GroupMember gm = new GroupMember();
        gm.setGroup(savedGroup);
        gm.setUser(creator);
        gm.setJoinedAt(LocalDateTime.now());
        groupMemberRepository.save(gm);

        Map<String, Object> params = new HashMap<>();
        params.put("userId", creator.getId().toString());
        params.put("groupId", savedGroup.getId().toString());

        activityService.log(
                ActionType.CREATE,
                ObjectType.GROUP,
                savedGroup.getId(),
                "user_created_group",
                params
        );

        log.info("Group created successfully: {}", savedGroup.getId());
        return savedGroup;
    }

    @Transactional(readOnly = true)
    public Group getGroupById(Long groupId) {
        return groupRepository.findByIdAndDeletedFalse(groupId)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Group getGroupByIdIncludeDeleted(Long groupId) {
        return groupRepository.findById(groupId)
                .orElse(null);
    }

    public Group updateGroup(Long groupId, String newName, String newType) {
        log.info("Updating group {} with name: {}, type: {}", groupId, newName, newType);
        Group group = getGroupById(groupId);
        if (group == null) {
            log.warn("Cannot update group {} because it does not exist", groupId);
            throw new AppException(ErrorCode.GROUP_NOT_FOUND);
        }

        boolean changed = false;
        List<Map<String, String>> changes = new ArrayList<>();
        if (newName != null && !newName.isEmpty() && !newName.equals(group.getName())) {
            changes.add(Map.of(
                    "field", "name",
                    "before", group.getName(),
                    "after", newName));
            group.setName(newName);
            changed = true;
        }
        if (newType != null && !newType.isEmpty()) {
            try {
                GroupType type = parseGroupType(newType);
                if (type != group.getType()) {
                    changes.add(Map.of(
                            "field", "type",
                            "before", group.getType().name(),
                            "after", newType));
                    group.setType(type);
                    changed = true;
                }
            } catch (IllegalArgumentException e) {
                log.warn("Unknown group type '{}', defaulting to OTHER in group updating", newType);
                group.setType(GroupType.OTHER);
                changed = true;
            }
        }

        Group savedGroup = groupRepository.save(group);

        if (changed) {
            Map<String, Object> params = new HashMap<>();
            params.put("userId", userService.getCurrentUser().getId().toString());
            params.put("groupId", savedGroup.getId().toString());
            params.put("changes", changes);
            activityService.log(
                    ActionType.UPDATE,
                    ObjectType.GROUP,
                    savedGroup.getId(),
                    "user_updated_group",
                    params
            );
        }

        return savedGroup;
    }

    @Transactional(readOnly = true)
    public Page<Group> getGroupsByUserIdAndGroupName(Long userId, String groupName, Pageable pageable) {
        log.debug("Getting groups for user: {}, and group name contains: {}", userId, groupName);
        return groupRepository.findAllByUserIdAndGroupNameContaining(userId, groupName.trim(), pageable);
    }

    private GroupType parseGroupType(String type) {
        GroupType groupType;
        try {
            groupType = GroupType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown expense type '{}', defaulting to OTHER", type);
            groupType = GroupType.OTHER;
        }
        return groupType;
    }

    public boolean isMemberOfGroup(Long userId, Long groupId) {
        return groupMemberRepository.existsByUserIdAndGroupIdAndDeletedFalse(userId, groupId);
    }

    public Set<Long> getAllMemberIdsOfGroup(Long groupId) {
        return new HashSet<>(groupMemberRepository.findUserIdsByGroupIdAndDeletedFalse(groupId));
    }
}
