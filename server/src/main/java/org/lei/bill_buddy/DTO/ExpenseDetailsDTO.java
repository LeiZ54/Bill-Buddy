package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.lei.bill_buddy.enums.ExpenseType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ExpenseDetailsDTO {
    private Long id;

    private String title;

    private Long groupId;

    private UserDTO payer;

    private String description;

    private ExpenseType type;

    private BigDecimal amount;

    private String currency;

    private LocalDateTime expenseDate;

    private BigDecimal debtsAmount;

    private Map<String, BigDecimal> shares;
}
