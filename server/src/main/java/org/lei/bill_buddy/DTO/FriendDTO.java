package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class FriendDTO {
    private Long id;
    private String fullName;
    private String email;
    private BigDecimal debtsWithCurrentUser;
}
