package org.lei.bill_buddy.service;

import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.ExpenseSummaryDTO;
import org.lei.bill_buddy.model.Expense;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;

import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.repository.*;

import jakarta.transaction.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final GroupService groupService;
    private final UserService userService;
    private final HistoryService historyService;
    private final Gson gson;

    @Transactional
    public List<Expense> getExpensesByGroupId(Long groupId) {
        return expenseRepository.findByGroupIdAndDeletedFalse(groupId);
    }

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
            if (!groupService.isMemberOfGroup(id, groupId)) {
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
        groupService.groupUpdated(expense.getGroup());
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
        groupService.groupUpdated(expense.getGroup());

        return expense;
    }

    @Transactional
    public void checkOutExpenseByGroupId(Long groupId) {
        Group group = groupService.getGroupById(groupId);
        if (group == null) {
            throw new RuntimeException("Group not found");
        }
        List<Long> expenseIds = expenseRepository.findIdsByGroupIdAndDeletedFalse(groupId);
        List<Long> memberIds = groupService.getMemberIdsByGroupId(groupId);
        List<Expense> expenses = getExpensesByExpenseIdS(expenseIds);
        List<History> histories = new ArrayList<>();
        String expensesIdsString = gson.toJson(expenseIds);
        String memberIdsString = gson.toJson(memberIds);
        for (User member : userService.getUsersByIds(memberIds)) {
            ExpenseSummaryDTO summary = getExpenseSummary(member.getId(), expenses);
            History history = new History();
            history.setGroup(group);
            history.setCreatedBy(userService.getCurrentUser());
            history.setUser(member);
            history.setUserLentJson(gson.toJson(summary.getOwesCurrentUser()));
            history.setUserPaidJson(gson.toJson(summary.getCurrentUserOwes()));
            history.setExpenseIds(expensesIdsString);
            history.setMemberIds(memberIdsString);
            histories.add(history);
        }
        historyService.createHistories(histories);
        expenseRepository.softDeleteByGroupId(groupId);
        groupService.groupUpdated(group);
    }

    public List<Expense> getExpensesByExpenseIdS(List<Long> expenseIds) {
        return expenseRepository.findAllById(expenseIds);
    }

    public List<Expense> getExpensesByGroupIdAndMonth(Long groupId, String month) {
        LocalDateTime start, end;
        if (month != null) {
            YearMonth ym = YearMonth.parse(month);
            start = ym.atDay(1).atStartOfDay();
            end = ym.atEndOfMonth().atTime(LocalTime.MAX);
            return expenseRepository.findByGroupIdAndExpenseDateBetweenAndDeletedFalse(groupId, start, end);
        } else {
            return expenseRepository.findByGroupIdAndDeletedFalse(groupId);
        }
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

    public List<ExpenseShare> getExpenseSharesByExpenseId(Long expenseId) {
        return expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);
    }

    public ExpenseSummaryDTO getExpenseSummary(Long currentUserId, List<Expense> expenses) {
        Map<Long, BigDecimal> balances = new HashMap<>();
        Set<Long> userIds = new HashSet<>();
        List<ExpenseShare> shares = expenses.stream()
                .flatMap(e -> getExpenseSharesByExpenseId(e.getId()).stream())
                .toList();

        for (ExpenseShare share : shares) {
            Long payerId = share.getExpense().getPayer().getId();
            Long userId = share.getUser().getId();
            userIds.add(payerId);
            userIds.add(userId);
            BigDecimal amount = share.getShareAmount();

            if (payerId.equals(currentUserId) && !userId.equals(currentUserId)) {
                balances.merge(userId, amount, BigDecimal::add);
            } else if (userId.equals(currentUserId) && !payerId.equals(currentUserId)) {
                balances.merge(payerId, amount.negate(), BigDecimal::add);
            }
        }

        Map<Long, BigDecimal> owesCurrentUser = new HashMap<>();
        Map<Long, BigDecimal> currentUserOwes = new HashMap<>();

        for (Map.Entry<Long, BigDecimal> entry : balances.entrySet()) {
            BigDecimal balance = entry.getValue();

            if (balance.compareTo(BigDecimal.ZERO) > 0) {
                owesCurrentUser.put(entry.getKey(), balance);
            } else if (balance.compareTo(BigDecimal.ZERO) < 0) {
                currentUserOwes.put(entry.getKey(), balance.abs());
            }
        }

        ExpenseSummaryDTO summary = new ExpenseSummaryDTO();
        summary.setOwesCurrentUser(owesCurrentUser);
        summary.setCurrentUserOwes(currentUserOwes);
        summary.setUserIds(userIds.stream().toList());
        return summary;
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


