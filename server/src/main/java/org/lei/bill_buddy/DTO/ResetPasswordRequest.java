package org.lei.bill_buddy.DTO;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String email;
    private String newPassword;
    private String token;
}
