package org.lei.bill_buddy.repository;

import io.lettuce.core.dynamic.annotation.Param;
import org.lei.bill_buddy.model.Friend;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {

    @Query("""
                SELECT f
                FROM Friend f
                JOIN f.friend u
                WHERE f.user.id = :userId
                  AND f.deleted = false
                  AND (LOWER(u.givenName) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(u.familyName) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Friend> findFriendsByUserIdAndNameOrEmail(@Param("userId") Long userId,
                                                     @Param("search") String search,
                                                     Pageable pageable);

    boolean existsByUserIdAndFriendIdAndDeletedFalse(Long userId, Long friendId);

    @Modifying
    @Query("""
    UPDATE Friend f
    SET f.deleted = true
    WHERE f.user.id = :userId
      AND f.friend.id = :friendId
      AND f.deleted = false
""")
    void softDeleteByUserIdAndFriendId(@Param("userId") Long userId, @Param("friendId") Long friendId);
}

