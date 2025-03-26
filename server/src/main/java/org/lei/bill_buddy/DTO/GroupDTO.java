package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class GroupDTO {
    private Long groupId;
    private String groupName;
    private Map<String, BigDecimal> owesCurrentUser;
    private Map<String, BigDecimal> currentUserOwes;
}
