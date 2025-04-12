package org.lei.bill_buddy.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.repository.ExpenseRepository;
import org.lei.bill_buddy.service.ExpenseService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringExpenseScheduler {

    private final ExpenseRepository expenseRepository;
    private final ExpenseService expenseService;

    @Scheduled(cron = "0 0 2 * * ?")
    public void generateRecurringExpenses() {
        log.info("Running recurring expense scheduler...");

        List<Expense> recurringExpenses = expenseRepository.findByIsRecurringTrueAndDeletedFalse();

        for (Expense original : recurringExpenses) {
            if (shouldGenerateNewExpense(original)) {
                try {
                    expenseService.duplicateExpense(original);
                    log.info("Created recurring expense for original ID: {}", original.getId());
                } catch (Exception e) {
                    log.error("Failed to duplicate recurring expense ID: {}", original.getId(), e);
                }
            }
        }
    }

    private boolean shouldGenerateNewExpense(Expense expense) {
        if (expense.getRecurrenceUnit() == null || expense.getRecurrenceInterval() == null) return false;

        LocalDateTime nextDueDate = switch (expense.getRecurrenceUnit()) {
            case WEEK -> expense.getExpenseDate().plusWeeks(expense.getRecurrenceInterval());
            case MONTH -> expense.getExpenseDate().plusMonths(expense.getRecurrenceInterval());
            case YEAR -> expense.getExpenseDate().plusYears(expense.getRecurrenceInterval());
            case DAY -> expense.getExpenseDate().plusDays(expense.getRecurrenceInterval());
        };

        return LocalDateTime.now().isAfter(nextDueDate);
    }
}
