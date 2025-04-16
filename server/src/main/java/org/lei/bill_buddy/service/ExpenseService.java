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
    private final GroupDebtService groupDebtService;
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

        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), groupId)) {
            log.warn("User {} is not a member of group {}", userService.getCurrentUser().getId(), groupId);
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        Group group = groupService.getGroupById(groupId);
        if (group == null) {
            log.warn("Group not found: {}", groupId);
            throw new AppException(ErrorCode.GROUP_NOT_FOUND);
        }

        User payer = userService.getUserById(payerId);
        if (payer == null) {
            log.warn("Payer user not found: {}", payerId);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        participantIds.forEach(id -> {
            if (!groupService.isMemberOfGroup(id, groupId)) {
                log.warn("User with id {} is not a member of group {}", id, groupId);
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
        for (ExpenseShare share : shares) {
            share.setDeleted(true);
            expenseShareRepository.save(share);

            if (!share.getUser().getId().equals(expense.getPayer().getId())) {
                groupDebtService.updateGroupDebt(
                        expense.getPayer(),
                        share.getUser(),
                        expense.getGroup(),
                        share.getShareAmount().negate()
                );
            }
        }

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

        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), expense.getGroup().getId())) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }

        User oldPayer = expense.getPayer();
        BigDecimal oldAmount = expense.getAmount();
        List<ExpenseShare> oldShares = expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);

        User newPayer = (payerId != null) ? userService.getUserById(payerId) : oldPayer;
        BigDecimal newAmount = (amount != null) ? amount : oldAmount;
        List<Long> newParticipantIds = (participantIds != null) ? participantIds : oldShares.stream().map(s -> s.getUser().getId()).toList();
        List<BigDecimal> newShareAmounts = new ArrayList<>(shareAmounts != null ? shareAmounts : oldShares.stream().map(ExpenseShare::getShareAmount).toList());

        if (payerId != null) expense.setPayer(newPayer);
        if (title != null && !title.isEmpty()) expense.setTitle(title);
        String groupCurrency = expense.getGroup().getDefaultCurrency().name();
        if (currency != null && !currency.isEmpty()) {
            if (!currency.equalsIgnoreCase(groupCurrency)) {
                log.info("Converting {} {} to {}", amount, currency, groupCurrency);
                BigDecimal rate = exchangeRateService.getExchangeRate(currency, groupCurrency);
                newAmount = exchangeRateService.convert(newAmount, rate);
                newShareAmounts.replaceAll(share -> exchangeRateService.convert(share, rate));
            }
            try {
                expense.setCurrency(Currency.valueOf(currency.toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Unsupported currency '{}', defaulting to USD in expense updating", currency);
                expense.setCurrency(Currency.USD);
            }
        }
        if (amount != null) expense.setAmount(newAmount);
        if (description != null && !description.isEmpty()) expense.setDescription(description);
        if (expenseDate != null) expense.setExpenseDate(expenseDate);
        if (isRecurring != null) expense.setIsRecurring(isRecurring);
        if (recurrenceUnit != null) expense.setRecurrenceUnit(recurrenceUnit);
        if (recurrenceInterval != null) expense.setRecurrenceInterval(recurrenceInterval);

        ExpenseType type;
        try {
            type = ExpenseType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown expense type '{}', defaulting to OTHER", typeStr);
            type = ExpenseType.OTHER;
        }
        expense.setType(type);

        Expense savedExpense = expenseRepository.save(expense);

        boolean isPayerChanged = !oldPayer.getId().equals(newPayer.getId());
        boolean isAmountChanged = oldAmount.compareTo(newAmount) != 0;
        boolean isParticipantsChanged = isParticipantListChanged(oldShares, newParticipantIds);

        if (isPayerChanged || isAmountChanged || isParticipantsChanged) {
            for (ExpenseShare oldShare : oldShares) {
                if (!oldShare.getUser().getId().equals(oldPayer.getId())) {
                    groupDebtService.updateGroupDebt(
                            oldPayer,
                            oldShare.getUser(),
                            expense.getGroup(),
                            oldShare.getShareAmount().negate()
                    );
                }
            }

            expenseShareRepository.deleteAll(oldShares);

            distributeShares(savedExpense, newParticipantIds, newShareAmounts, newAmount);
        } else {
            log.info("Expense debt unchanged; skip debt update.");
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
        log.info("participantIds={}", participantIds);
        log.info("shares={}", shares);
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
        groupDebtService.updateGroupDebt(expense.getPayer(), user, expense.getGroup(), shareAmount);
    }

    private boolean isParticipantListChanged(List<ExpenseShare> oldShares, List<Long> newIds) {
        if (oldShares.size() != newIds.size()) return true;
        List<Long> oldIds = oldShares.stream()
                .map(s -> s.getUser().getId()).toList();
        for (Long newId : newIds) {
            if (!oldIds.contains(newId)) {
                return true;
            }
        }
        return false;
    }

}
