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
import java.util.List;

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

    public List<GroupDebt> getByGroupAndLender(Group group, User lender) {
        return groupDebtRepository.findByGroupIdAndLenderIdAndDeletedFalse(group.getId(), lender.getId());
    }

    public List<GroupDebt> getByGroupAndBorrower(Group group, User borrower) {
        return groupDebtRepository.findByGroupIdAndBorrowerIdAndDeletedFalse(group.getId(), borrower.getId());
    }

}
