package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.ExpenseShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseShareRepository extends JpaRepository<ExpenseShare, Long> {
    List<ExpenseShare> findByExpenseIdAndDeletedFalse(Long expenseId);
}

