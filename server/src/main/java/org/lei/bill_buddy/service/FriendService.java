package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class FriendService {

    private final FriendRepository friendRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final UserService userService;

    public FriendRequest sendFriendRequest(Long senderId, Long receiverId) {
        log.info("User {} is sending a friend request to {}", senderId, receiverId);

        if (senderId.equals(receiverId)) {
            log.warn("User {} attempted to send a friend request to themselves", senderId);
            throw new IllegalArgumentException("You cannot send friend request to yourself.");
        }

        User sender = userService.getUserById(senderId);
        User receiver = userService.getUserById(receiverId);

        if (sender == null || receiver == null) {
            log.error("Sender or Receiver not found: senderId={}, receiverId={}", senderId, receiverId);
            throw new RuntimeException("User not found");
        }

        if (friendRepository.existsByUserAndFriendAndDeletedFalse(sender, receiver)) {
            log.warn("Users {} and {} are already friends", senderId, receiverId);
            throw new IllegalStateException("You are already friends.");
        }

        if (friendRequestRepository.existsBySenderAndReceiverAndStatus(sender, receiver, "pending")) {
            log.warn("Duplicate friend request detected: senderId={}, receiverId={}", senderId, receiverId);
            throw new IllegalStateException("Friend request already sent.");
        }

        FriendRequest request = new FriendRequest();
        request.setSender(sender);
        request.setReceiver(receiver);
        log.info("Friend request saved: sender={}, receiver={}", senderId, receiverId);
        return friendRequestRepository.save(request);
    }

    public void respondToRequest(Long requestId, boolean accepted) {
        log.info("Responding to friend request {}, accepted={}", requestId, accepted);
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> {
                    log.error("Friend request not found: id={}", requestId);
                    return new RuntimeException("Request not found");
                });

        if (!"pending".equals(request.getStatus())) {
            log.warn("Request {} has already been handled with status={}", requestId, request.getStatus());
            throw new IllegalStateException("Request already handled.");
        }

        if (accepted) {
            request.setStatus("accepted");
            addFriend(request.getSender(), request.getReceiver());
            log.info("Friend request {} accepted", requestId);
        } else {
            request.setStatus("rejected");
            log.info("Friend request {} rejected", requestId);
        }

        friendRequestRepository.save(request);
    }

    public void addFriend(User user, User friend) {
        log.info("Adding friend relationship: user={} <-> friend={}", user.getId(), friend.getId());

        if (user.getId().equals(friend.getId())) {
            log.warn("User {} attempted to add themselves as a friend", user.getId());
            throw new IllegalArgumentException("You cannot add yourself as a friend.");
        }

        if (friendRepository.existsByUserAndFriendAndDeletedFalse(user, friend)) {
            log.warn("Friendship already exists: user={}, friend={}", user.getId(), friend.getId());
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

        log.info("Friendship created successfully between {} and {}", user.getId(), friend.getId());
    }

    @Transactional(readOnly = true)
    public Page<Friend> getFriendsByUserId(Long userId, Pageable pageable) {
        log.debug("Fetching friends for userId={} with pagination", userId);
        return friendRepository.findAllByUserIdAndDeletedFalse(userId, pageable);
    }

    public FriendRequest getFriendRequestByRequestId(Long requestId) {
        log.debug("Fetching friend request by id={}", requestId);
        return friendRequestRepository.findById(requestId).orElse(null);
    }

    public List<FriendRequest> getFriendRequestsByReceiverIdAndStatus(Long userId, String status) {
        log.debug("Fetching friend requests for userId={} with status={}", userId, status);
        return friendRequestRepository.findByReceiverIdAndStatus(userId, status);
    }
}
