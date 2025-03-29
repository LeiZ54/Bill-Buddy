package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByIdAndDeletedFalse(Long id);

    @Query("""
                SELECT g FROM Group g
                JOIN GroupMember gm ON gm.group = g
                LEFT JOIN Expense e ON e.group = g AND e.deleted = false
                WHERE (gm.user.id = :userId OR g.creator.id = :userId)
                  AND g.deleted = false
                GROUP BY g
                ORDER BY MAX(e.createdAt) DESC NULLS LAST
            """)
    Page<Group> findAllByCreatorIdOrJoinedUserId(
            @Param("userId") Long userId,
            Pageable pageable
    );
}


