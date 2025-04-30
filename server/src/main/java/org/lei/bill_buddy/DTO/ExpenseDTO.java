package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.lei.bill_buddy.enums.ExpenseType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ExpenseDTO {
    private Long id;

    private String title;

    private UserDTO payer;

    private ExpenseType type;

    private BigDecimal amount;

    private String currency;

    private Boolean settled;

    private LocalDateTime expenseDate;

    private BigDecimal debtsAmount;
}
