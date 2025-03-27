package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FriendRequestDTO {
    private Long friendRequestId;
    private UserDTO sender;
    private LocalDateTime requestTime;
}
