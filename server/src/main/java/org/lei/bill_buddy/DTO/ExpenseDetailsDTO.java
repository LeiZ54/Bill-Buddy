package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.lei.bill_buddy.enums.ExpenseType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExpenseDetailsDTO {
    private Long id;

    private String title;

    private Long groupId;

    private UserDTO payer;

    private String picture;

    private String description;

    private ExpenseType type;

    private BigDecimal amount;

    private String currency;

    private String logs;

    private LocalDateTime expenseDate;

    private BigDecimal debtsAmount;

    private List<ShareOfUserDTO> shares;
}
