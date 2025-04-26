package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.RecurringExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, Long> {

    List<RecurringExpense> findAllByDeletedFalse();

    List<RecurringExpense> findByGroupIdAndDeletedFalse(Long groupId);
}
