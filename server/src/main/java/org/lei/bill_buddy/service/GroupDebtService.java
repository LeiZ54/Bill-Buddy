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
    private final UserService userService;

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

    public BigDecimal getTotalUserDebts(Long userId) {
        BigDecimal owesOthers = groupDebtRepository.findByBorrowerIdAndDeletedFalse(userId).stream()
                .map(GroupDebt::getAmount)
                .filter(amount -> amount.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal othersOweMe = groupDebtRepository.findByLenderIdAndDeletedFalse(userId).stream()
                .map(GroupDebt::getAmount)
                .filter(amount -> amount.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return othersOweMe.subtract(owesOthers);
    }

    public BigDecimal getDebtsBetweenUsers(Long userAId, Long userBId) {
        if (userAId.equals(userBId)) return BigDecimal.ZERO;
        if (userService.getUserById(userAId) == null) {
            log.warn("User {} not found", userAId);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        if (userService.getUserById(userBId) == null) {
            log.warn("User {} not found", userBId);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        BigDecimal aLentToB = groupDebtRepository.findByLenderIdAndBorrowerIdAndDeletedFalse(userAId, userBId)
                .stream()
                .map(GroupDebt::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bLentToA = groupDebtRepository.findByLenderIdAndBorrowerIdAndDeletedFalse(userBId, userAId)
                .stream()
                .map(GroupDebt::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return aLentToB.subtract(bLentToA);
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
            if (amount.compareTo(BigDecimal.ZERO) != 0) {
                Group group = groupMap.get(entry.getKey());
                result.put(group, amount);
            }
        }
        return result;
    }

    public List<GroupDebt> getByGroupAndLender(Group group, User lender) {
        return groupDebtRepository.findByGroupIdAndLenderIdAndDeletedFalse(group.getId(), lender.getId());
    }

    public List<GroupDebt> getByGroupAndBorrower(Group group, User borrower) {
        return groupDebtRepository.findByGroupIdAndBorrowerIdAndDeletedFalse(group.getId(), borrower.getId());
    }

}
