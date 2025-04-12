package org.lei.bill_buddy.service;

import com.google.gson.Gson;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;

@Slf4j
@RequiredArgsConstructor
@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final GroupService groupService;
    private final UserService userService;
    private final HistoryService historyService;
    private final Gson gson;

    @Transactional
    public List<Expense> getExpensesByGroupId(Long groupId) {
        log.info("Fetching expenses for groupId: {}", groupId);
        return expenseRepository.findByGroupIdAndDeletedFalse(groupId);
    }

    @Transactional
    public Expense createExpense(Long groupId, Long payerId, BigDecimal amount, String currency,
                                 String description, LocalDateTime expenseDate,
                                 List<Long> participantIds, List<BigDecimal> shareAmounts) {

        log.info("Creating expense: groupId={}, payerId={}, amount={}, currency={}, description={}, date={}, participants={}",
                groupId, payerId, amount, currency, description, expenseDate, participantIds);

        Group group = groupService.getGroupById(groupId);
        if (group == null) {
            log.error("Group not found: {}", groupId);
            throw new RuntimeException("Group not found");
        }

        User payer = userService.getUserById(payerId);
        if (payer == null) {
            log.error("Payer user not found: {}", payerId);
            throw new RuntimeException("User not found");
        }

        participantIds.forEach(id -> {
            if (!groupService.isMemberOfGroup(id, groupId)) {
                log.error("User with id {} is not a member of group {}", id, groupId);
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
        groupService.groupUpdated(group);
        log.info("Expense created successfully: id={}", savedExpense.getId());

        return savedExpense;
    }

    @Transactional
    public void deleteExpense(Long expenseId) {
        log.info("Deleting expense with id={}", expenseId);
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        expense.setDeleted(true);
        expenseRepository.save(expense);

        List<ExpenseShare> shares = expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);
        shares.forEach(s -> {
            s.setDeleted(true);
            expenseShareRepository.save(s);
        });

        groupService.groupUpdated(expense.getGroup());
        log.info("Expense deleted successfully: id={}", expenseId);
    }

    @Transactional
    public Expense updateExpense(Long expenseId, BigDecimal amount, String currency,
                                 String description, LocalDateTime expenseDate,
                                 List<Long> participantIds, List<BigDecimal> shareAmounts) {

        log.info("Updating expense: id={}", expenseId);
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (amount != null) expense.setAmount(amount);
        if (currency != null && !currency.isEmpty()) expense.setCurrency(currency);
        if (description != null && !description.isEmpty()) expense.setDescription(description);
        if (expenseDate != null) expense.setExpenseDate(expenseDate);

        Expense savedExpense = expenseRepository.save(expense);

        if (participantIds != null && !participantIds.isEmpty()) {
            List<ExpenseShare> shares = expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);
            expenseShareRepository.deleteAll(shares);
            distributeShares(savedExpense, participantIds, shareAmounts, amount);
        }

        groupService.groupUpdated(expense.getGroup());
        log.info("Expense updated: id={}", expenseId);

        return savedExpense;
    }

    public List<Expense> getExpensesByExpenseIdS(List<Long> expenseIds) {
        return expenseRepository.findAllById(expenseIds);
    }

    public List<Expense> getExpensesByGroupIdAndMonth(Long groupId, String month) {
        log.info("Getting expenses for groupId={} in month={}", groupId, month);
        if (month != null) {
            YearMonth ym = YearMonth.parse(month);
            LocalDateTime start = ym.atDay(1).atStartOfDay();
            LocalDateTime end = ym.atEndOfMonth().atTime(LocalTime.MAX);
            return expenseRepository.findByGroupIdAndExpenseDateBetweenAndDeletedFalse(groupId, start, end);
        }
        return expenseRepository.findByGroupIdAndDeletedFalse(groupId);
    }

    public boolean hasActiveExpensesInGroup(Long userId, Long groupId) {
        Long payerCount = expenseRepository.countExpensesByGroupAndPayer(groupId, userId);
        Long shareCount = expenseShareRepository.countSharesByGroupAndUser(groupId, userId);
        return (payerCount + shareCount) > 0;
    }

    private void distributeShares(Expense expense, List<Long> participantIds,
                                  List<BigDecimal> shares, BigDecimal totalAmount) {
        log.info("Distributing shares for expense id={}", expense.getId());
        Map<Long, User> participants = new HashMap<>();
        userService.getUsersByIds(participantIds).forEach(user -> participants.put(user.getId(), user));

        if (shares == null || shares.size() != participantIds.size()) {
            BigDecimal share = totalAmount.divide(BigDecimal.valueOf(participants.size()), 2, RoundingMode.HALF_UP);
            participants.forEach((id, u) -> createExpenseShare(expense, u, share));
        } else {
            for (int i = 0; i < participantIds.size(); i++) {
                createExpenseShare(expense, participants.get(participantIds.get(i)), shares.get(i));
            }
        }
    }

    public List<ExpenseShare> getExpenseSharesByExpenseId(Long expenseId) {
        return expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);
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
