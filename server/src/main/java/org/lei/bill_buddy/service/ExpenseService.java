package org.lei.bill_buddy.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.enums.ExpenseType;
import org.lei.bill_buddy.enums.RecurrenceUnit;
import org.lei.bill_buddy.model.*;
import org.lei.bill_buddy.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final RecurringExpenseRepository recurringExpenseRepository;
    private final GroupService groupService;
    private final UserService userService;
    private final GroupDebtService groupDebtService;
    private final ExchangeRateService exchangeRateService;

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
                                 String recurrenceUnit,
                                 Integer recurrenceInterval,
                                 List<Long> participantIds,
                                 List<BigDecimal> shareAmounts) {

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

        Set<Long> memberIds = groupService.getAllMemberIdsOfGroup(groupId);
        for (Long id : participantIds) {
            if (!memberIds.contains(id)) {
                throw new AppException(ErrorCode.PARTICIPANTS_NOT_A_MEMBER);
            }
        }

        ExpenseType type = parseExpenseType(typeStr);

        Currency groupCurrency = group.getDefaultCurrency();
        BigDecimal finalAmount = convertCurrency(amount, currency, group.getDefaultCurrency().name());

        log.info("Creating expense: groupId={}, payerId={}, amount={}, currency={}", groupId, payerId, finalAmount, groupCurrency);
        log.debug("Full expense creation details: title={}, type={}, desc={}, date={}, recurring={}, participants={}",
                title, type, description, expenseDate, isRecurring, participantIds);

        Expense expense = new Expense();
        expense.setGroup(group);
        expense.setPayer(payer);
        expense.setTitle(title);
        expense.setType(type);
        expense.setAmount(finalAmount);
        expense.setDescription(description);
        expense.setExpenseDate(expenseDate);
        if (isRecurring) {
            RecurringExpense recurringExpense = new RecurringExpense();
            recurringExpense.setGroup(group);
            recurringExpense.setTitle(title);
            recurringExpense.setAmount(finalAmount);
            recurringExpense.setPayer(payer);
            recurringExpense.setType(type);
            recurringExpense.setStartDate(expenseDate);
            recurringExpense.setParticipantIds(participantIds);
            recurringExpense.setShareAmounts(shareAmounts);
            recurringExpense.setDescription(description);
            recurringExpense.setRecurrenceInterval(recurrenceInterval);
            recurringExpense.setRecurrenceUnit(parseRecurrentUnit(recurrenceUnit));
            recurringExpenseRepository.save(recurringExpense);
        }
        Expense savedExpense = expenseRepository.save(expense);
        distributeShares(savedExpense, participantIds, shareAmounts, finalAmount);
        groupService.groupUpdated(group);
        settleGroupIfNeeded(savedExpense.getGroup().getId());

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
        settleGroupIfNeeded(expense.getGroup().getId());
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
            newAmount = convertCurrency(newAmount, currency, groupCurrency);
            newShareAmounts.replaceAll(share -> convertCurrency(share, currency, groupCurrency));
        }
        if (amount != null) expense.setAmount(newAmount);
        if (description != null && !description.isEmpty()) expense.setDescription(description);
        if (expenseDate != null) expense.setExpenseDate(expenseDate);
        if (typeStr != null && !typeStr.isEmpty()) expense.setType(parseExpenseType(typeStr));

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
        settleGroupIfNeeded(expense.getGroup().getId());
        log.info("Expense updated: id={}", expenseId);
        return savedExpense;
    }


    public Expense getExpenseById(Long id) {
        Expense expense = expenseRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.EXPENSE_NOT_FOUND));
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), expense.getGroup().getId()))
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        return expense;
    }

    @Transactional(readOnly = true)
    public Page<Expense> getExpenses(
            Long groupId,
            String title,
            Long payerId,
            String type,
            String month,
            Boolean settled,
            Pageable pageable) {
        log.info("Querying expenses with filters: groupId={}, payerId={}, type={}, month={}, title={}",
                groupId, payerId, type, month, title);
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), groupId)) {
            log.warn("User {} is not a member of group {} in getting expenses",
                    userService.getCurrentUser().getId(),
                    groupId);
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }

        Specification<Expense> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            predicates.add(cb.isFalse(root.get("deleted")));

            if (groupId != null) {
                predicates.add(cb.equal(root.get("group").get("id"), groupId));
            }

            if (payerId != null) {
                predicates.add(cb.equal(root.get("payer").get("id"), payerId));
            }

            if (type != null && !type.isEmpty()) {

                predicates.add(cb.equal(root.get("type"), parseExpenseType(type)));
            }

            if (title != null && !title.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }

            if (month != null && !month.isBlank()) {
                YearMonth ym = YearMonth.parse(month);
                LocalDateTime start = ym.atDay(1).atStartOfDay();
                LocalDateTime end = ym.atEndOfMonth().atTime(LocalTime.MAX);
                predicates.add(cb.between(root.get("expenseDate"), start, end));
            }

            if (settled != null) {
                predicates.add(cb.equal(root.get("settled"), settled));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return expenseRepository.findAll(spec, pageable);
    }

    public boolean hasActiveExpensesInGroup(Long userId, Long groupId) {
        Long payerCount = expenseRepository.countExpensesByGroupAndPayer(groupId, userId);
        Long shareCount = expenseShareRepository.countSharesByGroupAndUser(groupId, userId);
        return (payerCount + shareCount) > 0;
    }

    private void distributeShares(Expense expense, List<Long> participantIds,
                                  List<BigDecimal> shareAmounts, BigDecimal totalAmount) {
        log.info("Distributing shares for expense id={}", expense.getId());
        Map<Long, User> participants = userService.getUsersByIds(participantIds)
                .stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        List<ExpenseShare> sharesToSave = new ArrayList<>();

        if (shareAmounts == null || shareAmounts.size() != participantIds.size()) {
            BigDecimal averageShare = totalAmount.divide(BigDecimal.valueOf(participants.size()), 2, RoundingMode.HALF_UP);
            for (Long userId : participantIds) {
                ExpenseShare share = buildExpenseShare(expense, participants.get(userId), averageShare);
                sharesToSave.add(share);
            }
        } else {
            for (int i = 0; i < participantIds.size(); i++) {
                ExpenseShare share = buildExpenseShare(expense, participants.get(participantIds.get(i)), shareAmounts.get(i));
                sharesToSave.add(share);
            }
        }

        expenseShareRepository.saveAll(sharesToSave);

        for (ExpenseShare share : sharesToSave) {
            if (!share.getUser().getId().equals(expense.getPayer().getId())) {
                groupDebtService.updateGroupDebt(expense.getPayer(), share.getUser(), expense.getGroup(), share.getShareAmount());
            }
        }
    }


    public List<ExpenseShare> getExpenseSharesByExpenseId(Long expenseId) {
        return expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);
    }

    @Transactional
    protected void settleGroupIfNeeded(Long groupId) {
        if (groupDebtService.isGroupSettled(groupId)) {
            log.info("Group {} is fully settled. Marking all related expenses as settled.", groupId);
            expenseRepository.settleExpensesByGroupId(groupId);
        }
    }

    private ExpenseShare buildExpenseShare(Expense expense, User user, BigDecimal shareAmount) {
        ExpenseShare share = new ExpenseShare();
        share.setExpense(expense);
        share.setUser(user);
        share.setShareAmount(shareAmount);
        share.setDeleted(false);
        return share;
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

    private BigDecimal convertCurrency(BigDecimal amount, String fromCurrency, String toCurrency) {
        try {
            Currency.valueOf(fromCurrency.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unsupported currency '{}', defaulting to USD in expense updating", fromCurrency);
            fromCurrency = Currency.USD.name();
        }
        if (fromCurrency.equalsIgnoreCase(toCurrency)) {
            return amount;
        }
        BigDecimal rate = exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
        return exchangeRateService.convert(amount, rate);
    }

    private ExpenseType parseExpenseType(String type) {
        ExpenseType expenseType;
        try {
            expenseType = ExpenseType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown expense type '{}', defaulting to OTHER", type);
            expenseType = ExpenseType.OTHER;
        }
        return expenseType;
    }

    private RecurrenceUnit parseRecurrentUnit(String unit) {
        RecurrenceUnit recurrenceUnit;
        try {
            recurrenceUnit = RecurrenceUnit.valueOf(unit.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown recurrentUnit '{}', defaulting to MONTH", unit);
            recurrenceUnit = RecurrenceUnit.MONTH;
        }
        return recurrenceUnit;
    }
}
