package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.util.List;

@Data
public class FriendDetailsDTO {
    private Long id;
    private String avatar;
    private String fullName;
    private String email;
    private List<GroupDebtDTO> netDebts;
}
