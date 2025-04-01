package org.lei.bill_buddy.DTO;

import lombok.Data;

@Data
public class GroupCreateRequest {
    private String groupName;
    private String type;
}
