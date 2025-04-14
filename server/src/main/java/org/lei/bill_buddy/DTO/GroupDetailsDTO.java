package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class GroupDetailsDTO {
    private Long groupId;
    private String groupName;
    private String type;
    private String defaultCurrency;
    private Map<String, BigDecimal> owesCurrentUser;
    private Map<String, BigDecimal> currentUserOwes;
}
