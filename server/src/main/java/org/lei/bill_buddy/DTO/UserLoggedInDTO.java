package org.lei.bill_buddy.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserLoggedInDTO {
    private final Long id;
    private String username;
    private String email;
    private String token;
}
