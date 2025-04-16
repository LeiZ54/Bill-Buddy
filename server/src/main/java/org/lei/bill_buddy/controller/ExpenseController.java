package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.ExpenseCreateRequest;
import org.lei.bill_buddy.DTO.ExpenseUpdateRequest;
import org.lei.bill_buddy.annotation.RateLimit;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RateLimit
@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserService userService;
    private final GroupService groupService;
    private final DtoConvertorUtil dtoConvertor;

    @PostMapping
    public ResponseEntity<?> createExpense(@Valid @RequestBody ExpenseCreateRequest request) {
        Long currentUserId = userService.getCurrentUser().getId();

        Expense expense = expenseService.createExpense(
                request.getGroupId(),
                request.getPayerId() != null ? request.getPayerId() : currentUserId,
                request.getTitle(),
                request.getType(),
                request.getAmount(),
                request.getCurrency(),
                request.getDescription(),
                request.getExpenseDate(),
                request.getIsRecurring(),
                request.getRecurrenceUnit(),
                request.getRecurrenceInterval(),
                request.getParticipants(),
                request.getShares()
        );

        return ResponseEntity.ok("Expense created with ID: " + expense.getId());
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(@PathVariable Long id) {
        Expense expense = expenseService.getExpenseById(id);
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
                request.getIsRecurring(),
                request.getRecurrenceUnit(),
                request.getRecurrenceInterval(),
                request.getParticipants(),
                request.getShares()
        );

        return ResponseEntity.ok("Expense updated with ID: " + expense.getId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        Long currentUserId = userService.getCurrentUser().getId();

        if (!groupService.isMemberOfGroup(currentUserId, id)) {
            return ResponseEntity.status(403).body("You do not have permission to delete this expense.");
        }

        expenseService.deleteExpense(id);
        return ResponseEntity.ok("Expense deleted with ID: " + id);
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getExpensesByGroupId(
            @PathVariable Long groupId,
            @RequestParam(required = false) String month
    ) {
        Long currentUserId = userService.getCurrentUser().getId();

        if (!groupService.isMemberOfGroup(currentUserId, groupId)) {
            return ResponseEntity.status(403).body("You do not have permission to view expenses of this group.");
        }

        return ResponseEntity.ok(expenseService
                .getExpensesByGroupIdAndMonth(groupId, month)
                .stream()
                .map(dtoConvertor::convertExpenseToExpenseDTO)
                .collect(Collectors.toList()));
    }
}
