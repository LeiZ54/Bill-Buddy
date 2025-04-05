package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GroupCreateRequest {
    @NotBlank
    private String groupName;
    @NotBlank
    private String type;
}
