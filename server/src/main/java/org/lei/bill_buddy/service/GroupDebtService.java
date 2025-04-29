package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.GroupDebt;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.GroupDebtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor
public class GroupDebtService {
    private final GroupDebtRepository groupDebtRepository;

    public void addGroupDebt(User lender, User borrower, Group group) {
        GroupDebt groupDebt = new GroupDebt();
        groupDebt.setLender(lender);
        groupDebt.setBorrower(borrower);
        groupDebt.setGroup(group);
        groupDebt.setAmount(BigDecimal.ZERO);
        log.info("GroupDebt for lender {} and borrower{} created successfully", lender.getId(), borrower.getId());
        groupDebtRepository.save(groupDebt);
    }

    public void addGroupDebts(Group group, User user, List<User> otherMembers) {
        for (User member : otherMembers) {
            if (!user.getId().equals(member.getId())) {
                addGroupDebt(member, user, group);
                addGroupDebt(user, member, group);
            }
        }
    }

    public void updateGroupDebt(User lender, User borrower, Group group, BigDecimal amount) {
        if (lender.getId().equals(borrower.getId())) return;
        GroupDebt gb = groupDebtRepository.findByGroupIdAndLenderIdAndBorrowerIdAndDeletedFalse(group.getId(), lender.getId(), borrower.getId())
                .orElse(null);
        if (gb == null) {
            log.warn("GroupDebt not found");
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        gb.setAmount(gb.getAmount().add(amount));
        log.info("Lender {} borrowed borrower{} {} {}", lender.getId(), borrower.getId(), group.getDefaultCurrency(), amount);
        groupDebtRepository.save(gb);
    }

    public Map<Long, BigDecimal> getUserDebtsOfGroup(Long userId, Long groupId) {
        List<GroupDebt> userBorrowed = groupDebtRepository.findByGroupIdAndBorrowerIdAndDeletedFalse(groupId, userId);
        List<GroupDebt> userLent = groupDebtRepository.findByGroupIdAndLenderIdAndDeletedFalse(groupId, userId);
        return formatDebtsMap(userBorrowed, userLent);
    }

    public Map<Group, BigDecimal> getNetDebtsBetweenUsers(Long userAId, Long userBId) {
        List<GroupDebt> aLentToB = groupDebtRepository
                .findByLenderIdAndBorrowerIdAndDeletedFalse(userAId, userBId);

        List<GroupDebt> bLentToA = groupDebtRepository
                .findByLenderIdAndBorrowerIdAndDeletedFalse(userBId, userAId);

        Map<Long, BigDecimal> groupIdToAmount = new HashMap<>();
        Map<Long, Group> groupMap = new HashMap<>();

        for (GroupDebt debt : aLentToB) {
            Long groupId = debt.getGroup().getId();
            groupIdToAmount.merge(groupId, debt.getAmount(), BigDecimal::add);
            groupMap.putIfAbsent(groupId, debt.getGroup());
        }

        for (GroupDebt debt : bLentToA) {
            Long groupId = debt.getGroup().getId();
            groupIdToAmount.merge(groupId, debt.getAmount().negate(), BigDecimal::add);
            groupMap.putIfAbsent(groupId, debt.getGroup());
        }

        Map<Group, BigDecimal> result = new HashMap<>();
        for (Map.Entry<Long, BigDecimal> entry : groupIdToAmount.entrySet()) {
            BigDecimal amount = entry.getValue();
            Group group = groupMap.get(entry.getKey());
            result.put(group, amount);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public boolean isGroupSettled(Long groupId) {
        List<GroupDebt> debts = groupDebtRepository.findByGroupIdAndDeletedFalse(groupId);

        Map<String, BigDecimal> netDebts = new HashMap<>();

        for (GroupDebt debt : debts) {
            Long lenderId = debt.getLender().getId();
            Long borrowerId = debt.getBorrower().getId();
            BigDecimal amount = debt.getAmount();

            long min = Math.min(lenderId, borrowerId);
            long max = Math.max(lenderId, borrowerId);
            String key = min + "-" + max;

            BigDecimal signedAmount = lenderId < borrowerId ? amount : amount.negate();

            netDebts.merge(key, signedAmount, BigDecimal::add);
        }

        return netDebts.values().stream().allMatch(val -> val.compareTo(BigDecimal.ZERO) == 0);
    }

    private Map<Long, BigDecimal> formatDebtsMap(List<GroupDebt> userOwes, List<GroupDebt> owesUser) {
        Map<Long, BigDecimal> netDebts = new HashMap<>();

        for (GroupDebt debt : userOwes) {
            Long otherUserId = debt.getLender().getId();
            netDebts.put(otherUserId, netDebts.getOrDefault(otherUserId, BigDecimal.ZERO).subtract(debt.getAmount()));
        }

        for (GroupDebt debt : owesUser) {
            Long otherUserId = debt.getBorrower().getId();
            netDebts.put(otherUserId, netDebts.getOrDefault(otherUserId, BigDecimal.ZERO).add(debt.getAmount()));
        }
        return netDebts;
    }

    public List<GroupDebt> getByGroupAndLender(Group group, User lender) {
        return groupDebtRepository.findByGroupIdAndLenderIdAndDeletedFalse(group.getId(), lender.getId());
    }

    public List<GroupDebt> getByGroupAndBorrower(Group group, User borrower) {
        return groupDebtRepository.findByGroupIdAndBorrowerIdAndDeletedFalse(group.getId(), borrower.getId());
    }

}
