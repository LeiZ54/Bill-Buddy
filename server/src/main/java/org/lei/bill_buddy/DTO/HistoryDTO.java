package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class HistoryDTO {
    private Long id;
    private GroupDTO group;
    private List<ExpenseDTO> expenses;
    private Map<String, BigDecimal> currentUserLent;
    private Map<String, BigDecimal> currentUserPaid;
    private LocalDateTime generateTime;
}
