package org.lei.bill_buddy.DTO;

import lombok.Data;

@Data
public class GroupUpdateRequest {
    private String newName;
    private String newType;
    private Boolean monthly;
}
