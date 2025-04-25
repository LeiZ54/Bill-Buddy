package org.lei.bill_buddy.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.ExpenseCreateRequest;
import org.lei.bill_buddy.DTO.ExpenseDTO;
import org.lei.bill_buddy.DTO.ExpenseUpdateRequest;
import org.lei.bill_buddy.annotation.RateLimit;
import org.lei.bill_buddy.model.Expense;
import org.lei.bill_buddy.service.ExpenseService;
import org.lei.bill_buddy.service.GroupService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


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
}
