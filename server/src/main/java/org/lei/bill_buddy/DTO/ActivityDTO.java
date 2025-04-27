package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.lei.bill_buddy.enums.ActionType;
import org.lei.bill_buddy.enums.ObjectType;

import java.time.LocalDateTime;

@Data
public class ActivityDTO {

    private Long id;

    private Long userId;

    private ObjectType objectType;

    private Long objectId;

    private ActionType action;

    private String descriptionHtml;

    private Boolean accessible = true;

    private LocalDateTime createdAt;
}
