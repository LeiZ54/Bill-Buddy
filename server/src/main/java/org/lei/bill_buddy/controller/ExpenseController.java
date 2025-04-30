package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.DTO.*;
import org.lei.bill_buddy.annotation.RateLimit;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.model.RecurringExpense;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.RecurringExpenseService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@RateLimit
@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final RecurringExpenseService recurringExpenseService;
    private final UserService userService;
    private final GroupService groupService;
    private final DtoConvertorUtil dtoConvertor;

    @PostMapping
    public ResponseEntity<?> createExpense(@Valid @RequestBody ExpenseCreateRequest request) {
        Long currentUserId = userService.getCurrentUser().getId();

        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), request.getGroupId())) {
            log.warn("User {} is not a member of group {}", userService.getCurrentUser().getId(), request.getGroupId());
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        System.out.println(request.getPayerId());
        Expense expense = expenseService.createExpense(
                request.getGroupId(),
                request.getPayerId() != null ? request.getPayerId() : currentUserId,
                request.getTitle(),
                request.getType(),
                request.getAmount(),
                request.getCurrency(),
                request.getDescription(),
                LocalDateTime.of(request.getExpenseDate().toLocalDate(), LocalTime.now()),
                request.getIsRecurring(),
                request.getRecurrenceUnit(),
                request.getRecurrenceInterval(),
                request.getParticipants(),
                request.getShares()
        );

        return ResponseEntity.ok("Expense created with ID: " + expense.getId());
    }

    @PostMapping("settle-up")
    public ResponseEntity<?> settleUp(@Valid @RequestBody SettleUpRequest request) {
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), request.getGroupId())) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        expenseService.settle(
                request.getGroupId(),
                userService.getCurrentUser().getId(),
                request.getTo(),
                request.getCurrency(),
                request.getAmount()
        );
        return ResponseEntity.ok("Settled successfully.");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(@PathVariable Long id) {
        Expense expense = expenseService.getExpenseById(id);
        if (expense == null)
            throw new AppException(ErrorCode.EXPENSE_NOT_FOUND);
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), expense.getGroup().getId()))
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        return ResponseEntity.ok(dtoConvertor.convertExpenseToExpenseDetailsDTO(expense));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseUpdateRequest request) {

        Expense expense = expenseService.updateExpense(
                id,
                request.getPayerId(),
                request.getTitle(),
                request.getType(),
                request.getAmount(),
                request.getCurrency(),
                request.getDescription(),
                request.getExpenseDate(),
                request.getParticipants(),
                request.getShares()
        );

        return ResponseEntity.ok("Expense updated with ID: " + expense.getId());
    }

    @PutMapping("/{id}/picture")
    public ResponseEntity<?> updateExpensePicture(@PathVariable Long id, @RequestBody ExpenseUpdatePictureRequest request) {
        Expense expense = expenseService.getExpenseById(id);
        if (expense == null) throw new AppException(ErrorCode.EXPENSE_NOT_FOUND);
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), expense.getGroup().getId()))
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        expenseService.updateExpensePicture(id, request.getPicture());
        return ResponseEntity.ok("Expense picture updated with ID: " + id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        Long currentUserId = userService.getCurrentUser().getId();
        Expense expense = expenseService.getExpenseById(id);
        if (expense == null) throw new AppException(ErrorCode.EXPENSE_NOT_FOUND);
        if (expense.getSettled()) throw new AppException(ErrorCode.EXPENSE_ALREADY_SETTLED);

        if (!groupService.isMemberOfGroup(currentUserId, expense.getGroup().getId())) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }

        expenseService.deleteExpense(id);
        return ResponseEntity.ok("Expense deleted with ID: " + id);
    }

    @GetMapping
    public ResponseEntity<Page<ExpenseDTO>> getExpenses(
            @RequestParam Long groupId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long payerId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Boolean settled,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "expenseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Expense> expensePage = expenseService.getExpenses(groupId, title, payerId, type, month, settled, pageable);

        Page<ExpenseDTO> dtoPage = expensePage.map(dtoConvertor::convertExpenseToExpenseDTO);

        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{groupId}/recurring")
    public ResponseEntity<?> getRecurringExpensesByGroup(
            @PathVariable Long groupId
    ) {
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), groupId)) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        List<RecurringExpenseDTO> recurringExpenses = recurringExpenseService.getRecurringExpensesByGroup(groupId)
                .stream()
                .map(dtoConvertor::convertRecurringExpenseToRecurringExpenseDTO)
                .toList();

        return ResponseEntity.ok(recurringExpenses);
    }

    @GetMapping("/recurring/{id}")
    public ResponseEntity<?> getRecurringExpensesByRecurringId(@PathVariable Long id) {
        RecurringExpense recurringExpense = recurringExpenseService.getRecurringExpenseById(id);
        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), recurringExpense.getGroup().getId())) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        return ResponseEntity.ok(dtoConvertor.convertRecurringExpenseToRecurringExpenseDetailsDTO(recurringExpense));
    }

    @DeleteMapping("/recurring/{id}")
    public ResponseEntity<?> deleteRecurringExpense(@PathVariable Long id) {
        RecurringExpense recurring = recurringExpenseService.getRecurringExpenseById(id);
        User user = userService.getCurrentUser();

        if (!groupService.isMemberOfGroup(userService.getCurrentUser().getId(), recurring.getGroup().getId())) {
            throw new AppException(ErrorCode.NOT_A_MEMBER);
        }
        if(!recurring.getPayer().getId().equals(user.getId())) { throw new AppException(ErrorCode.FORBIDDEN,"Only the payer can delete recurring expenses"); }
        recurringExpenseService.deleteRecurringExpense(id);

        return ResponseEntity.ok("Recurring Expense deleted with ID: " + id);
    }

}
