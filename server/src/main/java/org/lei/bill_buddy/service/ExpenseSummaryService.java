package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.DTO.ExpenseSummaryDTO;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.model.ExpenseShare;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseSummaryService {
    private final ExpenseService expenseService;

    public ExpenseSummaryDTO getExpenseSummary(Long currentUserId, List<Expense> expenses) {
        log.debug("Generating expense summary for userId={}", currentUserId);
        Map<Long, BigDecimal> balances = new HashMap<>();
        Set<Long> userIds = new HashSet<>();
        List<ExpenseShare> shares = expenses.stream()
                .flatMap(e -> expenseService.getExpenseSharesByExpenseId(e.getId()).stream())
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
}
