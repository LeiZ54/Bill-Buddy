package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.lei.bill_buddy.enums.ExpenseType;
import org.lei.bill_buddy.enums.RecurrenceUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class RecurringExpenseDetailsDTO {
    private Long id;

    private String title;

    private GroupDTO group;

    private UserDTO payer;

    private BigDecimal amount;

    private ExpenseType type;

    private String description;

    private List<UserDTO> participants;

    private List<BigDecimal> shareAmounts;

    private LocalDateTime startDate;

    private RecurrenceUnit recurrenceUnit;

    private Integer recurrenceInterval;

    private LocalDateTime createdAt;
}
