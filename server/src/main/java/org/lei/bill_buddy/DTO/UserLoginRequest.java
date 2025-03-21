package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserLoginRequest {
    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
