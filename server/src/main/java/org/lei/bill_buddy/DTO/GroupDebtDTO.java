package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class GroupDebtDTO {
    private GroupDTO group;
    private BigDecimal debtAmount;
}
