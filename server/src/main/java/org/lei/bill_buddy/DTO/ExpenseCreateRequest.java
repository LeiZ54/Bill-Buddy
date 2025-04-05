package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExpenseCreateRequest {
    @NotBlank
    private Long groupId;

    @NotBlank
    private String description;

    private BigDecimal amount;

    @NotBlank
    private String currency;

    @NotBlank
    private LocalDateTime expenseDate;

    @NotBlank
    private List<Long> participants;

    private List<BigDecimal> shares;
}
