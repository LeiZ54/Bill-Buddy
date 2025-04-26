package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.lei.bill_buddy.enums.ExpenseType;

@Data
public class RecurringExpenseDTO {
    private Long id;

    private String title;

    private ExpenseType type;

}
