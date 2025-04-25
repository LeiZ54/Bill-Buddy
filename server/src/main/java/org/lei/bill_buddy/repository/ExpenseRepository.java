package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {

    List<Expense> findByIsRecurringTrueAndDeletedFalse();

    @Query("""
                SELECT COUNT(e) FROM Expense e
                WHERE e.group.id = :groupId
                AND e.payer.id = :userId
                AND e.deleted = false
            """)
    Long countExpensesByGroupAndPayer(@Param("groupId") Long groupId, @Param("userId") Long userId);

}
