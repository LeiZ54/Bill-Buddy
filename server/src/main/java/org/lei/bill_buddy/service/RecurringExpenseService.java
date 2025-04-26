package org.lei.bill_buddy.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecurringExpenseService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final ExpenseService expenseService;

    @Transactional
    public void deleteRecurringExpense(Long id) {
        RecurringExpense re = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RecurringExpense not found"));
        re.setDeleted(true);
        recurringExpenseRepository.save(re);
    }

    @Transactional
    public List<RecurringExpense> getRecurringExpensesByGroup(Long groupId) {
        return recurringExpenseRepository.findByGroupIdAndDeletedFalse(groupId);
    }

    @Transactional
    public RecurringExpense getRecurringExpenseById(Long id) {
        return recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RecurringExpense not found"));
    }

    @Transactional
    public void generateExpenseFromRecurring(RecurringExpense recurringExpense) {
        Expense expense = new Expense();
        expense.setTitle(recurringExpense.getTitle());
        expense.setGroup(recurringExpense.getGroup());
        expense.setPayer(recurringExpense.getPayer());
        expense.setAmount(recurringExpense.getAmount());
        expense.setType(recurringExpense.getType());
        expense.setDeleted(false);
        expense.setExpenseDate(LocalDateTime.now());
        expenseService.createExpense(
                recurringExpense.getGroup().getId(),
                recurringExpense.getPayer().getId(),
                recurringExpense.getTitle(),
                recurringExpense.getType().name(),
                recurringExpense.getAmount(),
                recurringExpense.getGroup().getDefaultCurrency().name(),
                recurringExpense.getDescription(),
                LocalDateTime.now(),
                true,
                null,
                null,
                recurringExpense.getParticipantIds(),
                recurringExpense.getShareAmounts()
        );
    }

    @Transactional
    public List<RecurringExpense> getActiveRecurringExpenses() {
        return recurringExpenseRepository.findAllByDeletedFalse();
    }

}
