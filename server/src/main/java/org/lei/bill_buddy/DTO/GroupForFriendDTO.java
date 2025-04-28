package org.lei.bill_buddy.DTO;

import lombok.Data;

@Data
public class GroupForFriendDTO {
    private Long groupId;
    private String groupName;
    private String type;
    private String defaultCurrency;
    private Boolean inGroup = false;
}
