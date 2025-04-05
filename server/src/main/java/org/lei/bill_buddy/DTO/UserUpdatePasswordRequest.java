package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserUpdatePasswordRequest {
    @NotBlank
    private String oldPassword;
}
