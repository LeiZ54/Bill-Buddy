package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByIdAndDeletedFalse(Long id);

    Page<Group> findAllByIdInAndNameContainingOrderByUpdatedAtDesc(List<Long> ids, @Param("groupName") String groupName, Pageable pageable);

    @Modifying
    @Query("UPDATE Group g SET g.deleted = true WHERE g.id = :groupId")
    void softDeleteByGroupId(@Param("groupId") Long groupId);
}


