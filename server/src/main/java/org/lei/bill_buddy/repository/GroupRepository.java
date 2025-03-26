package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByIdAndDeletedFalse(Long id);

    @Query("SELECT g FROM Group g " +
            "JOIN GroupMember gm ON gm.group = g " +
            "WHERE gm.user.id = :userId OR g.creator.id = :userId AND g.deleted = false")
    List<Group> findAllByCreatorIdOrJoinedUserId(@Param("userId") Long userId);

}


