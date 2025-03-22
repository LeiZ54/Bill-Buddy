package org.lei.bill_buddy.DTO;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String givenName;
    private String familyName;
}
