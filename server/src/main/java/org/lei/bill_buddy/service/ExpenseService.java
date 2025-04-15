package org.lei.bill_buddy.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.enums.ExpenseType;
import org.lei.bill_buddy.enums.RecurrenceUnit;
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
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final GroupService groupService;
    private final UserService userService;
    private final ExchangeRateService exchangeRateService;

    @Transactional
    public List<Expense> getExpensesByGroupId(Long groupId) {
        log.info("Fetching expenses for groupId: {}", groupId);
        return expenseRepository.findByGroupIdAndDeletedFalse(groupId);
    }

    @Transactional
    public Expense createExpense(Long groupId,
                                 Long payerId,
                                 String title,
                                 String typeStr,
                                 BigDecimal amount,
                                 String currency,
                                 String description,
                                 LocalDateTime expenseDate,
                                 Boolean isRecurring,
                                 RecurrenceUnit recurrenceUnit,
                                 Integer recurrenceInterval,
                                 List<Long> participantIds,
                                 List<BigDecimal> shareAmounts) {

        Group group = groupService.getGroupById(groupId);
        if (group == null) {
            log.error("Group not found: {}", groupId);
            throw new AppException(ErrorCode.GROUP_NOT_FOUND);
        }

        User payer = userService.getUserById(payerId);
        if (payer == null) {
            log.error("Payer user not found: {}", payerId);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        participantIds.forEach(id -> {
            if (!groupService.isMemberOfGroup(id, groupId)) {
                log.error("User with id {} is not a member of group {}", id, groupId);
                throw new AppException(ErrorCode.NOT_A_MEMBER);
            }
        });

        ExpenseType type;
        try {
            type = ExpenseType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown expense type '{}', defaulting to OTHER in expense creating", typeStr);
            type = ExpenseType.OTHER;
        }

        Currency groupCurrency = group.getDefaultCurrency();
        BigDecimal finalAmount = amount;

        if (!currency.equalsIgnoreCase(groupCurrency.name())) {
            log.info("Converting {} {} to {}", amount, currency, groupCurrency.name());
            BigDecimal rate = exchangeRateService.getExchangeRate(currency, groupCurrency.name());
            finalAmount = exchangeRateService.convert(amount, rate);
            shareAmounts.replaceAll(share -> exchangeRateService.convert(share, rate));
        }

        log.info("Creating expense: groupId={}, payerId={}, title={}, type={}, amount={}, currency={}, description={}, date={}, isRecurring={}, recurrenceUnit={}, recurrenceInterval={}, participants={}",
                groupId, payerId, title, type, finalAmount, groupCurrency, description, expenseDate, isRecurring, recurrenceUnit, recurrenceInterval, participantIds);

        Expense expense = new Expense();
        expense.setGroup(group);
        expense.setPayer(payer);
        expense.setTitle(title);
        expense.setType(type);
        expense.setAmount(finalAmount);
        expense.setCurrency(groupCurrency);
        expense.setDescription(description);
        expense.setExpenseDate(expenseDate);
        expense.setIsRecurring(isRecurring);
        expense.setRecurrenceUnit(recurrenceUnit);
        expense.setRecurrenceInterval(recurrenceInterval);

        Expense savedExpense = expenseRepository.save(expense);
        distributeShares(savedExpense, participantIds, shareAmounts, finalAmount);
        groupService.groupUpdated(group);

        log.info("Expense created successfully: id={}", savedExpense.getId());
        return savedExpense;
    }

    @Transactional
    public void deleteExpense(Long expenseId) {
        log.info("Deleting expense with id={}", expenseId);
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new AppException(ErrorCode.EXPENSE_NOT_FOUND));

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
    public Expense updateExpense(Long expenseId,
                                 Long payerId,
                                 String title,
                                 String typeStr,
                                 BigDecimal amount,
                                 String currency,
                                 String description,
                                 LocalDateTime expenseDate,
                                 Boolean isRecurring,
                                 RecurrenceUnit recurrenceUnit,
                                 Integer recurrenceInterval,
                                 List<Long> participantIds,
                                 List<BigDecimal> shareAmounts) {

        log.info("Updating expense: id={}", expenseId);
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new AppException(ErrorCode.EXPENSE_NOT_FOUND));
        ExpenseType type;
        try {
            type = ExpenseType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown expense type '{}', defaulting to OTHER", typeStr);
            type = ExpenseType.OTHER;
        }

        if (payerId != null) expense.setPayer(userService.getUserById(payerId));
        if (title != null && !title.isEmpty()) expense.setTitle(title);
        if (amount != null) expense.setAmount(amount);
        if (currency != null && !currency.isEmpty()) {
            Currency currencyEnum;
            try {
                currencyEnum = Currency.valueOf(currency.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Unsupported currency '{}', defaulting to USD in expense updating", currency);
                currencyEnum = Currency.USD;
            }
            expense.setCurrency(currencyEnum);
        }
        if (description != null && !description.isEmpty()) expense.setDescription(description);
        if (expenseDate != null) expense.setExpenseDate(expenseDate);
        if (isRecurring != null) expense.setIsRecurring(isRecurring);
        if (recurrenceUnit != null) expense.setRecurrenceUnit(recurrenceUnit);
        if (recurrenceInterval != null) expense.setRecurrenceInterval(recurrenceInterval);
        expense.setType(type);

        Expense savedExpense = expenseRepository.save(expense);

        if (participantIds != null && !participantIds.isEmpty()) {
            List<ExpenseShare> shares = expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);
            expenseShareRepository.deleteAll(shares);
            distributeShares(savedExpense, participantIds, shareAmounts, savedExpense.getAmount());
        }

        groupService.groupUpdated(expense.getGroup());
        log.info("Expense updated: id={}", expenseId);
        return savedExpense;
    }

    @Transactional
    public void duplicateExpense(Expense original) {
        Expense clone = new Expense();
        clone.setTitle(original.getTitle());
        clone.setGroup(original.getGroup());
        clone.setPayer(original.getPayer());
        clone.setAmount(original.getAmount());
        clone.setCurrency(original.getCurrency());
        clone.setType(original.getType());
        clone.setDeleted(false);
        clone.setDescription(original.getDescription());
        clone.setRecurrenceUnit(original.getRecurrenceUnit());
        clone.setRecurrenceInterval(original.getRecurrenceInterval());

        LocalDateTime newExpenseDate = switch (original.getRecurrenceUnit()) {
            case WEEK -> original.getExpenseDate().plusWeeks(original.getRecurrenceInterval());
            case MONTH -> original.getExpenseDate().plusMonths(original.getRecurrenceInterval());
            case YEAR -> original.getExpenseDate().plusYears(original.getRecurrenceInterval());
            case DAY -> original.getExpenseDate().plusDays(original.getRecurrenceInterval());
        };

        clone.setExpenseDate(newExpenseDate);

        Expense saved = expenseRepository.save(clone);

        List<ExpenseShare> shares = expenseShareRepository.findByExpenseIdAndDeletedFalse(original.getId());
        for (ExpenseShare s : shares) {
            ExpenseShare copy = new ExpenseShare();
            copy.setExpense(saved);
            copy.setUser(s.getUser());
            copy.setShareAmount(s.getShareAmount());
            copy.setDeleted(false);
            expenseShareRepository.save(copy);
        }

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
