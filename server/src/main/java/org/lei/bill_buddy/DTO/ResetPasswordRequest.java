package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank
    private String email;
    @NotBlank
    private String newPassword;
    @NotBlank
    private String token;
}
