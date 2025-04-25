package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.GroupDebt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupDebtRepository extends JpaRepository<GroupDebt, Long> {
    Optional<GroupDebt> findByGroupIdAndLenderIdAndBorrowerIdAndDeletedFalse(Long groupId, Long lenderId, Long borrowerId);

    List<GroupDebt> findByGroupIdAndBorrowerIdAndDeletedFalse(Long groupId, Long borrowerId);

    List<GroupDebt> findByGroupIdAndLenderIdAndDeletedFalse(Long groupId, Long lenderId);

    List<GroupDebt> findByLenderIdAndBorrowerIdAndDeletedFalse(Long lenderId, Long borrowerId);

    List<GroupDebt> findByGroupIdAndDeletedFalse(Long groupId);
}
