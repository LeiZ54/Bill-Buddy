package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {


    @Query("""
                SELECT COUNT(e) FROM Expense e
                WHERE e.group.id = :groupId
                AND e.payer.id = :userId
                AND e.deleted = false
            """)
    Long countExpensesByGroupAndPayer(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Modifying
    @Query("""
                UPDATE Expense e
                SET e.settled = true
                WHERE e.group.id = :groupId
                AND e.deleted = false
                AND e.settled = false
            """)
    void settleExpensesByGroupId(@Param("groupId") Long groupId);

    @Modifying
    @Query("""
                UPDATE Expense e
                SET e.deleted = true
                WHERE e.group.id = :groupId
                AND e.deleted = false
            """)
    void softDeleteExpensesByGroupId(@Param("groupId") Long groupId);

    @Modifying
    @Query("""
                UPDATE Expense e
                SET e.deleted = true
                WHERE e.id = :id
                AND e.deleted = false
            """)
    void softDeleteById(Long id);

    Optional<Expense> findExpenseByIdAndDeletedFalse(@Param("id") Long id);

    @Query("SELECT e.id FROM Expense e WHERE e.group.id IN :groupIds AND e.deleted = false")
    List<Long> findIdsByGroupIdInAndDeletedFalse(List<Long> groupIds);

    @Query("SELECT e.id FROM Expense e WHERE e.group.id IN :groupIds")
    List<Long> findIdsByGroupIdIn(List<Long> groupIds);
}
