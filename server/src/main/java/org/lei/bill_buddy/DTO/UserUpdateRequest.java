package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UserUpdateRequest {
    @Email
    private String email;

    private String givenName;

    private String familyName;
}
