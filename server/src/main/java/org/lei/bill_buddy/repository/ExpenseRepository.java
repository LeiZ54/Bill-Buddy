package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {
    List<Expense> findByGroupIdAndDeletedFalse(Long groupId);

    List<Expense> findByGroupIdAndExpenseDateBetweenAndDeletedFalse(Long groupId, LocalDateTime start, LocalDateTime end);

    List<Expense> findByIsRecurringTrueAndDeletedFalse();

    @Query("SELECT e.id FROM Expense e WHERE e.group.id = :groupId AND e.deleted = false")
    List<Long> findIdsByGroupIdAndDeletedFalse(@Param("groupId") Long groupId);

    List<Expense> findAllById(Iterable<Long> ids);

    @Modifying
    @Query("UPDATE Expense e SET e.deleted = true WHERE e.group.id = :groupId AND e.deleted = false")
    void softDeleteByGroupId(@Param("groupId") Long groupId);

    @Query("""
                SELECT COUNT(e) FROM Expense e
                WHERE e.group.id = :groupId
                AND e.payer.id = :userId
                AND e.deleted = false
            """)
    Long countExpensesByGroupAndPayer(@Param("groupId") Long groupId, @Param("userId") Long userId);

}
