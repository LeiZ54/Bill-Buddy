package org.lei.bill_buddy.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoggedInUserDTO {
    private String username;
    private String email;
    private String token;
}
