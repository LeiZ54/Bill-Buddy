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

    List<GroupMember> findAllByGroupIdAndDeletedFalse(Long groupId);

    @Query("SELECT gm.user.id FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.deleted = false")
    List<Long> findUserIdsByGroupIdAndDeletedFalse(@Param("groupId") Long groupId);

    Optional<GroupMember> findByGroupAndUserAndDeletedFalse(Group group, User user);

    boolean existsByUserIdAndGroupIdAndDeletedFalse(Long userId, Long groupId);

    @Modifying
    @Query("UPDATE GroupMember gm SET gm.deleted = true WHERE gm.group = :group")
    void softDeleteAllByGroup(@Param("group") Group group);

}