package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.ExpenseCreateRequest;
import org.lei.bill_buddy.DTO.ExpenseUpdateRequest;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserService userService;
    private final GroupService groupService;
    private final DtoConvertorUtil dtoConvertor;

    @PostMapping
    public ResponseEntity<?> createExpense(
            @Valid @RequestBody ExpenseCreateRequest request) {
        if (!groupService.isMemberOfGroup(request.getGroupId(), userService.getCurrentUser().getId())) {
            throw new RuntimeException("You do not have permission to add expense");
        }
        Expense expense = expenseService.createExpense(request.getGroupId(),
                userService.getCurrentUser().getId(),
                request.getAmount(),
                request.getCurrency(),
                request.getDescription(),
                request.getExpenseDate(),
                request.getParticipants(),
                request.getShares());
        return ResponseEntity.ok("Expense with id " + expense.getId() + " created");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(
            @PathVariable Long id) {

        if (!hasPermission(id)) {
            throw new RuntimeException("You do not have permission to delete this expense.");
        }
        expenseService.deleteExpense(id);
        return ResponseEntity.ok("Expense with id " + id + " deleted");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseUpdateRequest request) {

        if (!hasPermission(id)) {
            throw new RuntimeException("You do not have permission to update this expense.");
        }
        Expense expense = expenseService.updateExpense(
                id,
                request.getAmount(),
                request.getCurrency(),
                request.getDescription(),
                request.getExpenseDate(),
                request.getParticipants(),
                request.getShares()
        );

        return ResponseEntity.ok("Expense with id " + expense.getId() + " updated");
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getExpensesByGroupId(
            @PathVariable Long groupId,
            @RequestParam(required = false) String month
    ) {
        if (!groupService.isMemberOfGroup(groupId, userService.getCurrentUser().getId())) {
            throw new RuntimeException("You do not have permission to view the expenses.");
        }
        return ResponseEntity.ok(expenseService
                .getExpensesByGroupIdAndMonth(groupId, month)
                .stream()
                .map(dtoConvertor::convertExpenseToExpenseDTO)
                .collect(Collectors.toList()));
    }

    private boolean hasPermission(Long expenseId) {
        Expense expense = expenseService.getExpenseById(expenseId);
        User user = userService.getCurrentUser();
        if (expense == null) {
            throw new RuntimeException("Expense not found.");
        }
        return expense.getPayer().equals(user) || groupService.isMemberAdmin(expense.getGroup().getId(), user.getId());
    }
}
