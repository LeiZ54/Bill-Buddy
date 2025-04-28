package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.lei.bill_buddy.enums.ObjectType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ActivityDTO {

    private Long id;

    private String userAvatar;

    private String objectPicture;

    private ObjectType objectType;

    private Long objectId;

    private String descriptionHtml;

    private Boolean accessible = true;

    private LocalDateTime createdAt;
}
