package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByIdAndDeletedFalse(Long id);

    @Query(
            value = """
        SELECT g.* FROM groups_table g
        JOIN group_members gm ON gm.group_id = g.id AND gm.deleted = false
        WHERE (gm.user_id = :userId OR g.created_by = :userId)
          AND g.deleted = false
        GROUP BY g.id
        ORDER BY g.updated_at DESC
        """,
            countQuery = """
        SELECT COUNT(DISTINCT g.id) FROM groups_table g
        JOIN group_members gm ON gm.group_id = g.id AND gm.deleted = false
        WHERE (gm.user_id = :userId OR g.created_by = :userId)
          AND g.deleted = false
        """,
            nativeQuery = true
    )
    Page<Group> findAllByUserIdAndSortedByGroupUpdatedAt(
            @Param("userId") Long userId,
            Pageable pageable
    );

}


