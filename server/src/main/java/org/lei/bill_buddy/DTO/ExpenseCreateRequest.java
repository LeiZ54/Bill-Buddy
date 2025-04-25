package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.lei.bill_buddy.enums.RecurrenceUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExpenseCreateRequest {

    @NotNull(message = "Group ID cannot be null")
    private Long groupId;

    @NotNull(message = "Payer ID cannot be null")
    private Long payerId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Expense type is required")
    private String type;

    private String description;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    private String currency;

    @NotNull(message = "Expense date is required")
    private LocalDateTime expenseDate;

    @NotNull(message = "Participants list cannot be null")
    @Size(min = 1, message = "There must be at least one participant")
    private List<Long> participants;

    private List<BigDecimal> shares;

    private Boolean isRecurring = false;

    private String recurrenceUnit = RecurrenceUnit.MONTH.name();

    @Min(value = 1, message = "Recurrence interval must be at least 1")
    private Integer recurrenceInterval = 1;
}

