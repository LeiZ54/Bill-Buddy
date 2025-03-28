package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByGroupIdAndDeletedFalse(Long groupId);
}
