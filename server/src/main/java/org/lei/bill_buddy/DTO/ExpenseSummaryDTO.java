package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class ExpenseSummaryDTO {
    private List<Long> userIds;
    private Map<Long, BigDecimal> currentUserOwes;
    private Map<Long, BigDecimal> owesCurrentUser;
}
