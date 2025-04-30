package org.lei.bill_buddy.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.*;
import org.lei.bill_buddy.enums.Currency;
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
    private final ActivityService activityService;

    private static final BigDecimal EPS = new BigDecimal("0.01");

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
        BigDecimal finalAmount = exchangeRateService.convert(amount, parseCurrency(currency), group.getDefaultCurrency());

        log.info("Creating expense: groupId={}, payerId={}, amount={}, currency={}", groupId, payerId, finalAmount, groupCurrency);
        log.debug("Full expense creation details: title={}, type={}, desc={}, date={}, recurring={}, participants={}",
                title, type, description, expenseDate, isRecurring, participantIds);

        if (shareAmounts != null
                && participantIds.size() == shareAmounts.size()) {
            finalAmount = shareAmounts.stream()
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
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

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userService.getCurrentUser().getId().toString());
        params.put("expenseId", savedExpense.getId().toString());
        params.put("groupId", group.getId().toString());

        activityService.log(
                ActionType.CREATE,
                ObjectType.EXPENSE,
                savedExpense.getId(),
                "user_added_expense_to_group",
                params
        );

        groupService.groupUpdated(groupId);
        settleGroupIfNeeded(savedExpense.getGroup().getId());

        log.info("Expense created successfully: id={}", savedExpense.getId());
        return savedExpense;
    }

    @Transactional
    public void settle(
            Long groupId,
            Long from,
            Long to,
            Currency currency,
            BigDecimal pay) {
        User fromUser = userService.getUserById(from);
        User toUser = userService.getUserById(to);
        if (fromUser == null || toUser == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        Group group = groupService.getGroupById(groupId);
        Currency groupCurrency = group.getDefaultCurrency();
        Map<Long, BigDecimal> debts = groupDebtService.getDebtsBetweenUsersOfGroup(from, to, groupId);
        if (debts.get(from) == null || debts.get(from).compareTo(BigDecimal.ZERO) > 0) {
            throw new AppException(ErrorCode.CAN_NOT_SETTLE);
        }
        BigDecimal oweBase = debts.get(from).negate().abs();
        BigDecimal payBase = exchangeRateService.convert(pay, currency, groupCurrency);
        if (payBase.compareTo(oweBase.add(EPS)) > 0) throw new AppException(ErrorCode.OVER_PAYMENT);

        BigDecimal remaining = oweBase.subtract(payBase);
        BigDecimal paid = (remaining.abs().compareTo(EPS) <= 0) ? oweBase : payBase;
        Expense expense = new Expense();
        expense.setGroup(group);
        expense.setPayer(fromUser);
        expense.setTitle("Settle Up");
        expense.setType(ExpenseType.SETTLE_UP);
        expense.setAmount(paid);
        expense.setExpenseDate(LocalDateTime.now());
        Expense saved = expenseRepository.save(expense);
        distributeShares(expense, List.of(to), List.of(paid), paid);
        String amountStr = groupCurrency.equals(currency) ?
                String.format("%s %.2f", groupCurrency, paid) :
                String.format("%s %.2f(%s %.2f)", currency, pay, groupCurrency, paid);
        activityService.log(
                ActionType.CREATE,
                ObjectType.EXPENSE,
                saved.getId(),
                "user_settled_to_user_in_group",
                Map.of(
                        "userAId", from.toString(),
                        "userBId", to.toString(),
                        "amount", amountStr,
                        "groupId", groupId.toString()
                )
        );
        groupService.groupUpdated(groupId);
        settleGroupIfNeeded(groupId);
    }

    @Transactional
    public void deleteExpense(Long expenseId) {
        log.info("Deleting expense with id={}", expenseId);
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new AppException(ErrorCode.EXPENSE_NOT_FOUND));

        if (!userService.getCurrentUser().getId().equals(expense.getPayer().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN, "You do not have permission to delete this expense");
        }
        expenseRepository.softDeleteById(expenseId);

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

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userService.getCurrentUser().getId().toString());
        params.put("expenseId", expense.getId().toString());
        params.put("groupId", expense.getGroup().getId().toString());

        activityService.log(
                ActionType.DELETE,
                ObjectType.EXPENSE,
                expense.getId(),
                "user_deleted_expense",
                params
        );

        groupService.groupUpdated(expense.getGroup().getId());
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

        Expense expense = validateAndGetExpense(expenseId);
        if (!userService.getCurrentUser().getId().equals(expense.getPayer().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN, "You do not have permission to update this expense");
        }
        User oldPayer = expense.getPayer();
        BigDecimal oldAmount = expense.getAmount();
        Currency baseCur = expense.getGroup().getDefaultCurrency();

        List<ExpenseShare> oldShares = expenseShareRepository.findByExpenseIdAndDeletedFalse(expenseId);
        List<Long> oldParticipantIds = oldShares.stream().map(s -> s.getUser().getId()).toList();

        ParsedRequest pr = parseNewValues(
                expense, oldShares, payerId, title, typeStr, amount,
                currency, description, expenseDate, participantIds, shareAmounts, baseCur
        );

        List<Map<String, String>> changes = buildChangeList(expense, oldPayer, oldAmount,
                oldParticipantIds, pr);

        boolean debtRelatedChanged =
                pr.currencyChanged || pr.amountChanged || pr.sharesChanged() || pr.payerChanged;

        if (debtRelatedChanged) {
            rewriteDebtsAndShares(expense, oldPayer, oldShares,
                    pr.newPayer, pr.newParticipantIds, pr.newShareAmounts, pr.newAmount);
        } else {
            log.info("Expense debt unchanged; skip debt update.");
        }

        if (!changes.isEmpty()) {
            Expense saved = expenseRepository.save(expense);

            logActivityAndRefreshGroup(saved, expense.getGroup().getId(), changes);
            log.info("Expense updated successfully: id={}", expenseId);
            return saved;
        }

        log.info("No field changed. Expense untouched.");
        return expense;
    }

    public void updateExpensePicture(Long expenseId, String picture) {
        Expense expense = getExpenseById(expenseId);
        if (expense == null) throw new AppException(ErrorCode.EXPENSE_NOT_FOUND);
        expense.setPicture(picture);
        expenseRepository.save(expense);
    }

    public Expense getExpenseById(Long id) {
        return expenseRepository.findExpenseByIdAndDeletedFalse(id).orElse(null);
    }

    public Expense getExpenseByIdIncludeDeleted(Long id) {
        return expenseRepository.findById(id).orElse(null);
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
        BigDecimal finalAmount = BigDecimal.ZERO;
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
                finalAmount = finalAmount.add(share.getShareAmount());
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

    private boolean isSharesChanged(List<ExpenseShare> shares, List<Long> participantIds, List<BigDecimal> shareAmounts) {
        if (shares == null || participantIds == null || shareAmounts == null) {
            return true;
        }

        if (shares.size() != participantIds.size() || participantIds.size() != shareAmounts.size()) {
            return true;
        }

        Map<Long, BigDecimal> existingMap = shares.stream()
                .collect(Collectors.toMap(
                        share -> share.getUser().getId(),
                        ExpenseShare::getShareAmount
                ));

        for (int i = 0; i < participantIds.size(); i++) {
            Long participantId = participantIds.get(i);
            BigDecimal newShareAmount = shareAmounts.get(i);

            BigDecimal existingShareAmount = existingMap.get(participantId);
            if (existingShareAmount == null) {
                return true;
            }

            if (existingShareAmount.setScale(2, RoundingMode.HALF_UP)
                    .compareTo(newShareAmount.setScale(2, RoundingMode.HALF_UP)) != 0) {
                return true;
            }
        }

        return false;
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

    private Currency parseCurrency(String currency) {
        Currency currencyEnum;
        try {
            currencyEnum = Currency.valueOf(currency.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown currency '{}', defaulting to USD", currency);
            currencyEnum = Currency.USD;
        }
        return currencyEnum;
    }

    private List<Map<String, String>> detectParticipantChanges(List<Long> oldIds, List<Long> newIds) {
        List<Map<String, String>> changes = new ArrayList<>();

        Set<Long> oldSet = new HashSet<>(oldIds);
        Set<Long> newSet = new HashSet<>(newIds);

        Set<Long> added = new HashSet<>(newSet);
        added.removeAll(oldSet);

        if (!added.isEmpty()) {
            changes.add(Map.of(
                    "field", "participant_added",
                    "value", joinIds(new ArrayList<>(added))
            ));
        }

        Set<Long> removed = new HashSet<>(oldSet);
        removed.removeAll(newSet);

        if (!removed.isEmpty()) {
            changes.add(Map.of(
                    "field", "participant_removed",
                    "value", joinIds(new ArrayList<>(removed))
            ));
        }

        return changes;
    }

    private String joinIds(List<Long> ids) {
        return ids.stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    private String formatCurrencyAmount(Currency currency, BigDecimal amount) {
        if (currency == null || amount == null) return "";
        return currency.name() + " " + amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private Expense validateAndGetExpense(Long expenseId) {
        Expense expense = getExpenseById(expenseId);
        User currentUser = userService.getCurrentUser();
        if (expense == null) throw new AppException(ErrorCode.EXPENSE_NOT_FOUND);
        if (expense.getSettled()) throw new AppException(ErrorCode.EXPENSE_ALREADY_SETTLED);

        if (!groupService.isMemberOfGroup(currentUser.getId(),
                expense.getGroup().getId())) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        if (!expense.getPayer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN, "Only the payer can update this expense.");
        }
        return expense;
    }

    private ParsedRequest parseNewValues(
            Expense expense, List<ExpenseShare> oldShares,
            Long payerId, String title, String typeStr, BigDecimal amount,
            String currency, String description, LocalDateTime expenseDate,
            List<Long> participantIds, List<BigDecimal> shareAmounts,
            Currency baseCur) {

        User oldPayer = expense.getPayer();
        User newPayer = (payerId != null) ? userService.getUserById(payerId) : oldPayer;
        boolean payerChanged = !oldPayer.getId().equals(newPayer.getId());

        Currency newCur = (currency != null && !currency.isBlank())
                ? parseCurrency(currency) : baseCur;
        boolean currencyChanged = !newCur.equals(baseCur);
        BigDecimal newAmount;
        boolean amountChanged = false;
        if (amount != null) {
            newAmount = amount;
            amountChanged = !newAmount.equals(expense.getAmount());
        } else {
            newAmount = expense.getAmount();
        }

        BigDecimal initialAmount = BigDecimal.ZERO;

        List<Long> newParticipantIds = (participantIds != null) ? participantIds :
                oldShares.stream().map(s -> s.getUser().getId()).toList();

        List<BigDecimal> newShareAmounts = new ArrayList<>();
        if (shareAmounts != null && shareAmounts.size() == newParticipantIds.size()) {
            newShareAmounts = shareAmounts;

            if (currencyChanged) {
                BigDecimal sumBase = BigDecimal.ZERO;
                for (int i = 0; i < newShareAmounts.size(); i++) {
                    BigDecimal shareBase = exchangeRateService.convert(newShareAmounts.get(i), newCur, baseCur);
                    initialAmount = initialAmount.add(newShareAmounts.get(i));
                    sumBase = sumBase.add(shareBase);
                    newShareAmounts.set(i, shareBase);
                }
                newAmount = sumBase;
            } else {
                newAmount = newShareAmounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        } else if (currencyChanged) {
            initialAmount = newAmount;
            newAmount = exchangeRateService.convert(newAmount, newCur, baseCur);
        }

        if (payerId != null) expense.setPayer(newPayer);
        if (description != null) expense.setDescription(description);
        if (expenseDate != null) expense.setExpenseDate(expenseDate);
        if (typeStr != null) expense.setType(parseExpenseType(typeStr));

        String oldTitle = expense.getTitle();
        String newTitle = (title != null && !title.isBlank()) ? title : oldTitle;
        expense.setTitle(newTitle);

        expense.setAmount(newAmount);
        return new ParsedRequest(
                newPayer, payerChanged,
                newParticipantIds, newShareAmounts, newCur, newAmount, initialAmount,
                currencyChanged, amountChanged,
                oldTitle, newTitle
        );
    }

    private record ParsedRequest(
            User newPayer, boolean payerChanged,
            List<Long> newParticipantIds,
            List<BigDecimal> newShareAmounts,
            Currency initialCurrency,
            BigDecimal newAmount,
            BigDecimal initialAmount,
            boolean currencyChanged,
            boolean amountChanged,
            String oldTitle,
            String newTitle
    ) {
        boolean sharesChanged() {
            return !newShareAmounts.isEmpty();
        }
    }

    private List<Map<String, String>> buildChangeList(
            Expense expense, User oldPayer, BigDecimal oldAmount,
            List<Long> oldParticipantIds, ParsedRequest pr) {

        List<Map<String, String>> changes = new ArrayList<>();

        if (pr.payerChanged) {
            changes.add(Map.of("field", "payer",
                    "before", oldPayer.getFullName(),
                    "after", pr.newPayer.getFullName()));
        }
        String oldTitle = pr.oldTitle;
        String newTitle = pr.newTitle;
        if (oldTitle != null && newTitle != null && !oldTitle.equals(newTitle)) {
            changes.add(Map.of(
                    "field", "title",
                    "before", oldTitle,
                    "after", newTitle
            ));
        }

        if (pr.currencyChanged || pr.amountChanged) {
            changes.add(Map.of("field", "amount",
                    "before", formatCurrencyAmount(expense.getGroup().getDefaultCurrency(), oldAmount),
                    "after", !pr.currencyChanged ?
                            formatCurrencyAmount(expense.getGroup().getDefaultCurrency(), pr.newAmount) :
                            formatCurrencyAmount(pr.initialCurrency, pr.initialAmount) +
                                    "(" + formatCurrencyAmount(expense.getGroup().getDefaultCurrency(), pr.newAmount) + ")"
            ));
        }

        changes.addAll(detectParticipantChanges(oldParticipantIds, pr.newParticipantIds));

        return changes;
    }

    private void rewriteDebtsAndShares(Expense expense,
                                       User oldPayer,
                                       List<ExpenseShare> oldShares,
                                       User newPayer,
                                       List<Long> newIds,
                                       List<BigDecimal> newAmounts,
                                       BigDecimal newTotal) {

        for (ExpenseShare s : oldShares) {
            if (!s.getUser().getId().equals(newPayer.getId())) {
                groupDebtService.updateGroupDebt(oldPayer, s.getUser(),
                        expense.getGroup(), s.getShareAmount().negate());
            }
        }
        expenseShareRepository.deleteAll(oldShares);

        distributeShares(expense, newIds, newAmounts, newTotal);
    }

    @Transactional
    protected void logActivityAndRefreshGroup(Expense savedExpense,
                                              Long groupId,
                                              List<Map<String, String>> changes) {

        Map<String, String> base = Map.of("userId", userService.getCurrentUser().getId().toString(),
                "expenseId", savedExpense.getId().toString(),
                "groupId", groupId.toString());

        Map<String, Object> full = new HashMap<>(base);
        full.put("changes", changes);

        activityService.log(ActionType.UPDATE,
                ObjectType.EXPENSE,
                savedExpense.getId(),
                "user_updated_expense",
                full);

        groupService.groupUpdated(groupId);
        settleGroupIfNeeded(groupId);
    }

}
