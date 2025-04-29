package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.enums.ObjectType;
import org.lei.bill_buddy.model.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    @Query(value = """
            SELECT a.*\s
            FROM activities a
            WHERE\s
                (
                    (a.object_type = 'GROUP' AND a.object_id IN :groupIds)
                    OR
                    (a.object_type = 'EXPENSE' AND a.object_id IN :expenseIds)
                )
            ORDER BY a.created_at DESC
           \s""",
            countQuery = """
                    SELECT COUNT(*)
                    FROM activities a
                    WHERE\s
                        (
                            (a.object_type = 'GROUP' AND a.object_id IN :groupIds)
                            OR
                            (a.object_type = 'EXPENSE' AND a.object_id IN :expenseIds)
                        )
                   \s""",
            nativeQuery = true
    )
    Page<Activity> findByExpenseIdsAndGroupIdsOrderByCreatedAtDesc(List<Long> expenseIds, List<Long> groupIds, Pageable pageable);

    List<Activity> findByObjectTypeAndObjectIdOrderByCreatedAtDesc(ObjectType objectType, Long objectId);
}


