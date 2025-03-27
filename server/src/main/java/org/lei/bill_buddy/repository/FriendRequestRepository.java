package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.FriendRequest;
import org.lei.bill_buddy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    boolean existsBySenderAndReceiverAndStatus(User sender, User receiver, String status);

    List<FriendRequest> findByReceiverIdAndStatus(Long receiverId, String status);
}
