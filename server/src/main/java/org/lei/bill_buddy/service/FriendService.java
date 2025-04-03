package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.model.Friend;
import org.lei.bill_buddy.model.FriendRequest;
import org.lei.bill_buddy.model.User;
import org.lei.bill_buddy.repository.FriendRepository;
import org.lei.bill_buddy.repository.FriendRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class FriendService {
    private final FriendRepository friendRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final UserService userService;

    public FriendRequest sendFriendRequest(Long senderId, Long receiverId) {
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("You cannot send friend request to yourself.");
        }

        User sender = userService.getUserById(senderId);
        User receiver = userService.getUserById(receiverId);
        if (sender == null) {
            throw new RuntimeException("User with id " + senderId + " not found");
        }

        if (receiver == null) {
            throw new RuntimeException("User with id " + receiverId + " not found");
        }
        if (friendRepository.existsByUserAndFriendAndDeletedFalse(sender, receiver)) {
            throw new IllegalStateException("You are already friends.");
        }

        if (friendRequestRepository.existsBySenderAndReceiverAndStatus(sender, receiver, "pending")) {
            throw new IllegalStateException("Friend request already sent.");
        }

        FriendRequest request = new FriendRequest();
        request.setSender(sender);
        request.setReceiver(receiver);
        return friendRequestRepository.save(request);
    }

    public void respondToRequest(Long requestId, boolean accepted) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!"pending".equals(request.getStatus())) {
            throw new IllegalStateException("Request already handled.");
        }

        if (accepted) {
            request.setStatus("accepted");
            addFriend(request.getSender(), request.getReceiver());
        } else {
            request.setStatus("rejected");
        }

        friendRequestRepository.save(request);
    }

    public void addFriend(User user, User friend) {
        if (user.getId().equals(friend.getId())) {
            throw new IllegalArgumentException("You cannot add yourself as a friend.");
        }

        if (friendRepository.existsByUserAndFriendAndDeletedFalse(user, friend)) {
            throw new IllegalStateException("You are already friends.");
        }

        Friend userToFriend = new Friend();
        userToFriend.setUser(user);
        userToFriend.setFriend(friend);
        userToFriend.setDeleted(false);
        userToFriend.setCreatedAt(LocalDateTime.now());

        Friend friendToUser = new Friend();
        friendToUser.setUser(friend);
        friendToUser.setFriend(user);
        friendToUser.setDeleted(false);
        friendToUser.setCreatedAt(LocalDateTime.now());

        friendRepository.save(userToFriend);
        friendRepository.save(friendToUser);

    }

    @Transactional(readOnly = true)
    public Page<Friend> getFriendsByUserId(Long userId, Pageable pageable) {
        return friendRepository.findAllByUserIdAndDeletedFalse(userId, pageable);
    }

    public FriendRequest getFriendRequestByRequestId(Long requestId) {
        return friendRequestRepository.findById(requestId).orElse(null);
    }

    public List<FriendRequest> getFriendRequestsByReceiverIdAndStatus(Long userId, String status) {
        return friendRequestRepository.findByReceiverIdAndStatus(userId, status);
    }
}
