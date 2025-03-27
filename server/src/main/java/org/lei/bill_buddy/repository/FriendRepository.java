package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Friend;
import org.lei.bill_buddy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {
    List<Friend> findAllByUserIdAndDeletedFalse(Long userId);
    Optional<Friend> findByUserAndFriendAndDeletedFalse(User user, User friend);
    boolean existsByUserAndFriendAndDeletedFalse(User user, User friend);
}

