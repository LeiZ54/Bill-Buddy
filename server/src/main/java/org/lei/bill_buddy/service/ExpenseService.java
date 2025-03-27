package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.model.Expense;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;

import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.repository.*;

import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final GroupService groupService;
    private final UserService userService;

    @Transactional
    public Expense createExpense(Long groupId,
                                 Long payerId,
                                 BigDecimal amount,
                                 String currency,
                                 String description,
                                 LocalDateTime expenseDate,
                                 List<Long> participantIds,
                                 List<BigDecimal> shareAmounts) {
        Group group = groupService.getGroupById(groupId);
        if (group == null) {
            throw new RuntimeException("Group not found");
        }
        User payer = userService.getUserById(payerId);
        if (payer == null) {
            throw new RuntimeException("User not found");
        }
        participantIds.forEach(id -> {
            if (!groupService.isMemberOfGroup(groupId, id)) {
                throw new RuntimeException("User with id " + id + " is not a member of this group");
            }
        });
        Expense expense = new Expense();
        expense.setGroup(group);
        expense.setPayer(payer);
        expense.setAmount(amount);
        expense.setCurrency(currency);
        expense.setDescription(description);
        expense.setExpenseDate(expenseDate);

        Expense savedExpense = expenseRepository.save(expense);

        distributeShares(savedExpense, participantIds, shareAmounts, amount);

        return savedExpense;
    }

    @Transactional
    public void deleteExpense(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(() -> new RuntimeException("Expense not found"));
        expense.setDeleted(true);
        expenseRepository.save(expense);

        List<ExpenseShare> shares = expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);
        shares.forEach(s -> {
            s.setDeleted(true);
            expenseShareRepository.save(s);
        });
    }

    @Transactional
    public Expense updateExpense(
            Long expenseId,
            BigDecimal amount,
            String currency,
            String description,
            LocalDateTime expenseDate,
            List<Long> participantIds,
            List<BigDecimal> shareAmounts) {
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(() -> new RuntimeException("Expense not found"));
        if (amount != null) {
            expense.setAmount(amount);
        }
        if (currency != null && !currency.isEmpty()) {
            expense.setCurrency(currency);
        }

        if (description != null && !description.isEmpty()) {
            expense.setDescription(description);
        }

        if (expenseDate != null) {
            expense.setExpenseDate(expenseDate);
        }

        Expense savedExpense = expenseRepository.save(expense);

        if (participantIds != null && !participantIds.isEmpty()) {
            List<ExpenseShare> shares = expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);
            expenseShareRepository.deleteAll(shares);

            distributeShares(savedExpense, participantIds, shareAmounts, amount);
        }

        return expense;
    }

    public List<ExpenseShare> getExpenseSharesByGroupId(Long groupId) {
        List<Expense> expenses = expenseRepository.findByGroupIdAndDeletedFalse(groupId);
        return expenses.stream()
                .flatMap(e -> expenseShareRepository.findByExpenseIdAndDeletedFalse(e.getId()).stream())
                .collect(java.util.stream.Collectors.toList());
    }

    public Expense getExpenseById(Long expenseId) {
        return expenseRepository.findById(expenseId)
                .orElse(null);
    }

    private void distributeShares(
            Expense expense,
            List<Long> participantIds,
            List<BigDecimal> shares,
            BigDecimal totalAmount
    ) {
        Map<Long, User> participants = new HashMap<>();
        userService.getUsersByIds(participantIds).forEach(user -> {
            participants.put(user.getId(), user);
        });

        if (shares == null || shares.size() != participantIds.size()) {
            BigDecimal share = totalAmount.divide(BigDecimal.valueOf(participants.size()), 2, RoundingMode.HALF_UP);
            participants.forEach((id, u) -> {
                createExpenseShare(expense, u, share);
            });
        } else {
            totalAmount = BigDecimal.valueOf(0);
            for (int i = 0; i < participantIds.size(); i++) {
                createExpenseShare(expense, participants.get(participantIds.get(i)), shares.get(i));
                totalAmount = totalAmount.add(shares.get(i));
            }
        }
    }

    private void createExpenseShare(Expense expense, User user, BigDecimal shareAmount) {
        ExpenseShare share = new ExpenseShare();
        share.setExpense(expense);
        share.setUser(user);
        share.setShareAmount(shareAmount);
        share.setDeleted(false);
        expenseShareRepository.save(share);
    }

}


