package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.util.List;

@Data
public class FriendsListDTO {
    private List<UserDTO> friends;
    private List<FriendRequestDTO> pendingRequests;
}
