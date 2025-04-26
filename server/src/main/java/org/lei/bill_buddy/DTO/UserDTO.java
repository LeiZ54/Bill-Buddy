package org.lei.bill_buddy.DTO;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String avatar;
    private String fullName;
    private String givenName;
    private String familyName;
    private String email;
}
