package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByIdAndDeletedFalse(Long id);

    @Query(value = """
             SELECT g.*\s
             FROM groups_table g
             JOIN group_members gm ON gm.group_id = g.id AND gm.deleted = false
             WHERE (gm.user_id = :userId OR g.created_by = :userId)
               AND g.deleted = false
               AND (:groupName IS NULL OR g.name LIKE %:groupName%)
             GROUP BY g.id
             ORDER BY g.updated_at DESC
            \s""", countQuery = """
            SELECT COUNT(DISTINCT g.id) 
            FROM groups_table g
            JOIN group_members gm ON gm.group_id = g.id AND gm.deleted = false
            WHERE (gm.user_id = :userId OR g.created_by = :userId)
              AND g.deleted = false
              AND (:groupName IS NULL OR g.name LIKE %:groupName%)
            """, nativeQuery = true)
    Page<Group> findAllByUserIdAndGroupNameContaining(@Param("userId") Long userId, @Param("groupName") String groupName, Pageable pageable);

    @Modifying
    @Query("UPDATE Group g SET g.deleted = true WHERE g.id = :groupId")
    void softDeleteByGroupId(@Param("groupId") Long groupId);
}


