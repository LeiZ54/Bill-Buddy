package org.lei.bill_buddy.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.model.RecurringExpense;
import org.lei.bill_buddy.service.RecurringExpenseService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringExpenseScheduler {

    private final RecurringExpenseService recurringExpenseService;

    @Scheduled(cron = "0 0 2 * * ?")
    public void generateRecurringExpenses() {
        log.info("Running recurring expense scheduler...");

        List<RecurringExpense> recurringExpenses = recurringExpenseService.getActiveRecurringExpenses();

        for (RecurringExpense recurring : recurringExpenses) {
            if (shouldGenerateNewExpense(recurring)) {
                try {
                    recurringExpenseService.generateExpenseFromRecurring(recurring);
                    log.info("Created expense from recurring ID: {}", recurring.getId());
                } catch (Exception e) {
                    log.error("Failed to generate expense from recurring ID: {}", recurring.getId(), e);
                }
            }
        }
    }

    private boolean shouldGenerateNewExpense(RecurringExpense recurring) {
        if (recurring.getRecurrenceUnit() == null || recurring.getRecurrenceInterval() == null) return false;

        LocalDateTime nextDueDate = recurring.getStartDate();
        while (nextDueDate.isBefore(LocalDateTime.now())) {
            switch (recurring.getRecurrenceUnit()) {
                case WEEK -> nextDueDate = nextDueDate.plusWeeks(recurring.getRecurrenceInterval());
                case MONTH -> nextDueDate = nextDueDate.plusMonths(recurring.getRecurrenceInterval());
                case YEAR -> nextDueDate = nextDueDate.plusYears(recurring.getRecurrenceInterval());
                case DAY -> nextDueDate = nextDueDate.plusDays(recurring.getRecurrenceInterval());
            }
        }

        return nextDueDate.isAfter(LocalDateTime.now().minusMinutes(5))
                && nextDueDate.isBefore(LocalDateTime.now().plusMinutes(5));
    }
}
