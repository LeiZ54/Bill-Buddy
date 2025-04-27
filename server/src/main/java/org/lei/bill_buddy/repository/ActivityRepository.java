package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    @Query(value = """
            SELECT a.* FROM activities a
            LEFT JOIN groups_table g ON a.object_type = 'GROUP' AND a.object_id = g.id
            LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.deleted = false
            LEFT JOIN expenses e ON a.object_type = 'EXPENSE' AND a.object_id = e.id
            LEFT JOIN expense_shares es ON es.expense_id = e.id AND es.deleted = false
            WHERE 
                (
                    (a.object_type = 'GROUP' AND (g.created_by = :userId OR gm.user_id = :userId))
                    OR
                    (a.object_type = 'EXPENSE' AND (e.payer_id = :userId OR es.user_id = :userId))
                )
            GROUP BY a.id
            ORDER BY a.created_at DESC
            """,
            countQuery = """
                    SELECT COUNT(DISTINCT a.id) FROM activities a
                    LEFT JOIN groups_table g ON a.object_type = 'GROUP' AND a.object_id = g.id
                    LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.deleted = false
                    LEFT JOIN expenses e ON a.object_type = 'EXPENSE' AND a.object_id = e.id
                    LEFT JOIN expense_shares es ON es.expense_id = e.id AND es.deleted = false
                    WHERE 
                        (
                            (a.object_type = 'GROUP' AND (g.created_by = :userId OR gm.user_id = :userId))
                            OR
                            (a.object_type = 'EXPENSE' AND (e.payer_id = :userId OR es.user_id = :userId))
                        )
                    """,
            nativeQuery = true
    )
    Page<Activity> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);
}


