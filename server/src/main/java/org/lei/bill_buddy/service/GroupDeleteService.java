package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.repository.ExpenseRepository;
import org.lei.bill_buddy.repository.GroupMemberRepository;
import org.lei.bill_buddy.repository.GroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Transactional
@RequiredArgsConstructor
@Service
public class GroupDeleteService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseRepository expenseRepository;

    @Transactional
    public void deleteGroup(Long groupId) {
        log.warn("Deleting group with id: {}", groupId);
        groupMemberRepository.softDeleteAllByGroupId(groupId);
        groupRepository.softDeleteByGroupId(groupId);
        expenseRepository.softDeleteExpensesByGroupId(groupId);
        log.info("Group {} marked as deleted.", groupId);
    }
}
