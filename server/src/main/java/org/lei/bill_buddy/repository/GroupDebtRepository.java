package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.GroupDebt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupDebtRepository extends JpaRepository<GroupDebt, Long> {
    Optional<GroupDebt> findByGroupIdAndLenderIdAndBorrowerIdAndDeletedFalse(Long groupId, Long lenderId, Long borrowerId);

    List<GroupDebt> findByGroupIdAndBorrowerIdAndDeletedFalse(Long groupId, Long borrowerId);

    List<GroupDebt> findByGroupIdAndLenderIdAndDeletedFalse(Long groupId, Long lenderId);

    List<GroupDebt> findByLenderIdAndBorrowerIdAndDeletedFalse(Long lenderId, Long borrowerId);

    List<GroupDebt> findByGroupIdAndDeletedFalse(Long groupId);

    @Modifying
    @Query("""
                UPDATE GroupDebt gd
                SET gd.deleted = true
                WHERE gd.group.id = :groupId
                  AND gd.lender.id = :lenderId
                  AND gd.deleted = false
            """)
    void softDeleteByGroupIdAndLenderIdAndDeletedFalse(@Param("groupId") Long groupId, @Param("lenderId") Long lenderId);

    @Modifying
    @Query("""
                UPDATE GroupDebt gd
                SET gd.deleted = true
                WHERE gd.group.id = :groupId
                  AND gd.borrower.id = :borrowerId
                  AND gd.deleted = false
            """)
    void softDeleteByGroupIdAndBorrowerIdAndDeletedFalse(@Param("groupId") Long groupId, @Param("borrowerId") Long borrowerId);


    @Modifying
    @Query("""
                UPDATE GroupDebt gd
                SET gd.deleted = true
                WHERE gd.group.id = :groupId
                  AND gd.deleted = false
            """)
    void softDeleteByGroupIdAndDeletedFalse(@Param("groupId") Long groupId);

}
