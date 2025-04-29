package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    @Query(value = """
            SELECT a.* 
            FROM activities a
            WHERE 
                (
                    (a.object_type = 'GROUP' AND a.object_id IN :groupIds)
                    OR
                    (a.object_type = 'EXPENSE' AND a.object_id IN :expenseIds)
                )
            ORDER BY a.created_at DESC
            """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM activities a
                    WHERE 
                        (
                            (a.object_type = 'GROUP' AND a.object_id IN :groupIds)
                            OR
                            (a.object_type = 'EXPENSE' AND a.object_id IN :expenseIds)
                        )
                    """,
            nativeQuery = true
    )
    Page<Activity> findByExpenseIdsAndGroupIdsOrderByCreatedAtDesc(List<Long> expenseIds, List<Long> groupIds, Pageable pageable);
}


