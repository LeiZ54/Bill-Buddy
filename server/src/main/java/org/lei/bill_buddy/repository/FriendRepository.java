package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Friend;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {
    @EntityGraph(attributePaths = {"friend"})
    Page<Friend> findAllByUserIdAndDeletedFalse(Long userId, Pageable pageable);

    boolean existsByUserIdAndFriendIdAndDeletedFalse(Long userId, Long friendId);
}

