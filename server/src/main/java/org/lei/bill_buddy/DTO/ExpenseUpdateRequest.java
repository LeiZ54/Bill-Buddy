package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.lei.bill_buddy.enums.ExpenseType;
import org.lei.bill_buddy.enums.RecurrenceUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExpenseUpdateRequest {
    private Long payerId;

    private String title;

    private String description;

    private String type;

    private BigDecimal amount;

    private String currency;

    private LocalDateTime expenseDate;

    private List<Long> participants;

    private List<BigDecimal> shares;
}
