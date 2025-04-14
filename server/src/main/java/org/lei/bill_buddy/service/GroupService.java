package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.GroupType;
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

@Slf4j
@Transactional
@RequiredArgsConstructor
@Service
public class GroupService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    public void groupUpdated(Group group) {
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

        log.info("Group created successfully: {}", savedGroup.getId());
        return savedGroup;
    }

    @Transactional(readOnly = true)
    public Group getGroupById(Long groupId) {
        log.debug("Fetching group by ID: {}", groupId);
        return groupRepository.findByIdAndDeletedFalse(groupId)
                .orElse(null);
    }

    public Group updateGroup(Long groupId, String newName, String defaultCurrency, String newType) {
        log.info("Updating group {} with name: {}, type: {}", groupId, newName, newType);
        Group group = getGroupById(groupId);
        if (newName != null && !newName.isEmpty()) {
            group.setName(newName);
        }
        if (newType != null && !newType.isEmpty()) {
            GroupType type;
            try {
                type = GroupType.valueOf(newType.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Unknown group type '{}', defaulting to OTHER in group updating", newType);
                type = GroupType.OTHER;
            }
            group.setType(type);
        }
        if (defaultCurrency != null && !defaultCurrency.isEmpty()) {
            Currency currencyEnum;
            try {
                currencyEnum = Currency.valueOf(defaultCurrency.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Unsupported currency '{}', defaulting to USD in group updating", defaultCurrency);
                currencyEnum = Currency.USD;
            }
            group.setDefaultCurrency(currencyEnum);
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

    public boolean isMemberOfGroup(Long userId, Long groupId) {
        return groupMemberRepository.existsByUserIdAndGroupIdAndDeletedFalse(userId, groupId);
    }

}
