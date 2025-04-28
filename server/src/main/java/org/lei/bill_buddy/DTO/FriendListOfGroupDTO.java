package org.lei.bill_buddy.DTO;

import lombok.Data;

@Data
public class FriendListOfGroupDTO {
    private Long id;
    private String avatar;
    private String fullName;
    private String email;
    private Boolean inGroup = false;
}
