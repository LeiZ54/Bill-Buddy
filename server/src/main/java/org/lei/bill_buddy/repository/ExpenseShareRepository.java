package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.ExpenseShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseShareRepository extends JpaRepository<ExpenseShare, Long> {
    List<ExpenseShare> findByExpenseIdAndDeletedFalse(Long expenseId);

    @Query("""
                SELECT COUNT(s) FROM ExpenseShare s
                WHERE s.expense.group.id = :groupId
                AND s.user.id = :userId
                AND s.deleted = false
            """)
    Long countSharesByGroupAndUser(@Param("groupId") Long groupId, @Param("userId") Long userId);

}

