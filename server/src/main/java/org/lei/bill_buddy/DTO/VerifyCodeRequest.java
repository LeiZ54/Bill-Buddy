package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class VerifyCodeRequest {
    @Email
    private String email;
    private String code;
}

