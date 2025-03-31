package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ExpenseDTO {
    private Long id;
    private UserDTO payer;
    private String description;
    private BigDecimal amount;
    private Map<String, BigDecimal> shares;
    private String currency;
    private LocalDateTime expenseDate;

}
