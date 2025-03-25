package org.lei.bill_buddy.DTO;

import lombok.Data;

@Data
public class UserUpdatePasswordRequest {
    private String oldPassword;
}
