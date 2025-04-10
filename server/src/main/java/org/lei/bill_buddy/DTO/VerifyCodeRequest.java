package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyCodeRequest {
    @Email
    @NotBlank
    private String email;
    @NotBlank
    private String code;
}

