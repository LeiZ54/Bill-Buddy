package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.GroupMember;
import org.lei.bill_buddy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    List<GroupMember> findAllByGroupAndDeletedFalse(Group group);

    Optional<GroupMember> findByGroupAndUserAndDeletedFalse(Group group, User user);

    boolean existsByGroupIdAndUserIdAndDeletedFalse(Long groupId, Long userId);

    @Modifying
    @Query("UPDATE GroupMember gm SET gm.deleted = true WHERE gm.group = :group")
    void softDeleteAllByGroup(@Param("group") Group group);

    boolean existsByUserIdAndGroupIdAndRoleAndDeletedFalse(Long userId, Long groupId, String role);
}