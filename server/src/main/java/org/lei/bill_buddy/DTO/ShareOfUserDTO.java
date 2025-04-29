package org.lei.bill_buddy.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ShareOfUserDTO {
    private UserDTO user;
    private BigDecimal shareAmount;
}
