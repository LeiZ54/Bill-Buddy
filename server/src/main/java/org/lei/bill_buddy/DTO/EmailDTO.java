package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.io.Serializable;

@Data
public class EmailDTO implements Serializable {
    private String type;
    private String toEmail;
    private String username;
    private String groupName;
    private String code;
    private String inviteLink;
}
