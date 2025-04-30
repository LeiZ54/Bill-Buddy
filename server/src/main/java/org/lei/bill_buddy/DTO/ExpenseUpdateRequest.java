package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExpenseUpdateRequest {
    private Long payerId;

    private String title;

    private String description;

    private String type;

    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    private String currency;

    private LocalDateTime expenseDate;

    private List<Long> participants;

    private List<BigDecimal> shares;
}
