package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExpenseCreateRequest {
    private Long groupId;
    private String description;
    private BigDecimal amount;
    private String currency;
    private LocalDateTime expenseDate;
    private List<Long> participants;
    private List<BigDecimal> shares;

}
