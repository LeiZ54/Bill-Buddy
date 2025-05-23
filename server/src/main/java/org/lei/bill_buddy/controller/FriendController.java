package org.lei.bill_buddy.controller;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.FriendListDTO;
import org.lei.bill_buddy.DTO.FriendRequestDTO;
import org.lei.bill_buddy.annotation.RateLimit;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ErrorCode;
import org.lei.bill_buddy.model.Friend;
import org.lei.bill_buddy.model.FriendRequest;
import org.lei.bill_buddy.service.FriendService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;
import java.util.stream.Collectors;

@RateLimit
@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {
    private final FriendService friendService;
    private final UserService userService;
    private final DtoConvertorUtil dtoConvertor;

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
    public ResponseEntity<?> getFriends(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "") String search
    ) {
        Long currentUserId = userService.getCurrentUser().getId();
        Pageable pageable = PageRequest.of(page, size);
        Page<Friend> friendsPage = friendService.getFriendsByUserIdAndSearch(currentUserId, search, pageable);
        return ResponseEntity.ok(formatFriendsListDTO(friendsPage));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFriend(@PathVariable Long id) {

        if (!friendService.isFriend(userService.getCurrentUser().getId(), id)) {
            throw new AppException(ErrorCode.FRIEND_RELATIONSHIP_NOT_FOUND, "This user is not your friend");
        }
        return ResponseEntity.ok(dtoConvertor.convertUserToFriendDetailsDTO(userService.getUserById(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFriend(@PathVariable Long id) {
        if (!friendService.isFriend(userService.getCurrentUser().getId(), id))
            throw new AppException(ErrorCode.FRIEND_RELATIONSHIP_NOT_FOUND, "This user is not your friend");

        friendService.deleteFriendRelationship(userService.getCurrentUser().getId(), id);
        return ResponseEntity.ok("Friend deleted successfully");
    }

    private FriendListDTO formatFriendsListDTO(Page<Friend> friends) {
        FriendListDTO friendsListDTO = new FriendListDTO();
        friendsListDTO.setFriends(friends.map(f -> dtoConvertor.convertUserToFriendDetailsDTO(f.getFriend())));
        friendsListDTO.setPendingRequests(friendService.getFriendRequestsByReceiverIdAndStatus(
                        userService.getCurrentUser().getId(),
                        "pending")
                .stream().map(this::convertFriendRequestToDTO).collect(Collectors.toList()));
        return friendsListDTO;
    }

    private FriendRequestDTO convertFriendRequestToDTO(FriendRequest friendRequest) {
        FriendRequestDTO friendRequestDTO = new FriendRequestDTO();
        friendRequestDTO.setFriendRequestId(friendRequest.getId());
        friendRequestDTO.setSender(dtoConvertor.convertUserToUserDTO(friendRequest.getSender()));
        friendRequestDTO.setRequestTime(friendRequest.getCreatedAt());
        return friendRequestDTO;
    }
}
