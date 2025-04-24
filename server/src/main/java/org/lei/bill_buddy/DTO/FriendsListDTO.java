package org.lei.bill_buddy.DTO;

import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
public class FriendsListDTO {
    private Page<FriendDTO> friends;
    private List<FriendRequestDTO> pendingRequests;
}
