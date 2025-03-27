package org.lei.bill_buddy.controller;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.FriendRequestDTO;
import org.lei.bill_buddy.DTO.FriendsListDTO;
import org.lei.bill_buddy.model.Friend;
import org.lei.bill_buddy.model.FriendRequest;
import org.lei.bill_buddy.service.FriendService;
import org.lei.bill_buddy.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {
    private final FriendService friendService;
    private final UserService userService;

    @PostMapping("/request/{receiverId}")
    public ResponseEntity<?> sendRequest(@PathVariable Long receiverId) {
        Long senderId = userService.getCurrentUser().getId();
        FriendRequest request = friendService.sendFriendRequest(senderId, receiverId);
        return ResponseEntity.ok(convertFriendRequestToDTO(request));
    }

    @PostMapping("/respond/{requestId}")
    public ResponseEntity<?> respondToRequest(@PathVariable Long requestId, @RequestParam boolean accepted) {
        FriendRequest request = friendService.getFriendRequestByRequestId(requestId);
        if (request != null && !Objects.equals(request.getReceiver().getId(), userService.getCurrentUser().getId())) {
            throw new RuntimeException("You are not allowed to respond");
        }
        friendService.respondToRequest(requestId, accepted);
        return ResponseEntity.ok("Request " + (accepted ? "accepted" : "rejected"));
    }

    @GetMapping
    public ResponseEntity<?> friends() {
        return ResponseEntity.ok(formatFriendsListDTO(friendService.getFriendsByUserId(userService.getCurrentUser().getId())));
    }

    private FriendsListDTO formatFriendsListDTO(List<Friend> friends) {
        FriendsListDTO friendsListDTO = new FriendsListDTO();
        friendsListDTO.setFriends(friends.stream().map(f -> userService.convertUserToUserDTO(f.getFriend())).collect(Collectors.toList()));
        friendsListDTO.setPendingRequests(friendService.getFriendRequestsByReceiverIdAndStatus(
                        userService.getCurrentUser().getId(),
                        "pending")
                .stream().map(this::convertFriendRequestToDTO).collect(Collectors.toList()));
        return friendsListDTO;
    }

    private FriendRequestDTO convertFriendRequestToDTO(FriendRequest friendRequest) {
        FriendRequestDTO friendRequestDTO = new FriendRequestDTO();
        friendRequestDTO.setFriendRequestId(friendRequest.getId());
        friendRequestDTO.setSender(userService.convertUserToUserDTO(friendRequest.getSender()));
        friendRequestDTO.setRequestTime(friendRequest.getCreatedAt());
        return friendRequestDTO;
    }
}
