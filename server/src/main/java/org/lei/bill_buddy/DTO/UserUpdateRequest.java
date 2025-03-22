package org.lei.bill_buddy.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserUpdateRequest {
    @NotBlank
    private String username;

    @NotBlank
    @Email
    private String email;

    private String givenName;

    private String familyName;
}
