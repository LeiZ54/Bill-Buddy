package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.Group;
import org.lei.bill_buddy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// GroupRepository.java
@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    // 可添加自定义方法，比如根据创建者ID或成员ID查询群组
    // 如果不需要就用默认的 findById 等方法即可

    // 方法1: 查找某用户创建的群组
    List<Group> findAllByCreatedById(Long userId);

    // 方法2: 如果在GroupMembers中做子查询
    // 也可使用@Query + JPQL实现一次性查询
    // 例如:
    @Query("SELECT g FROM Group g " +
            "JOIN GroupMember gm ON gm.group = g " +
            "WHERE gm.user.id = :userId OR g.createdBy.id = :userId")
    List<Group> findAllByCreatedByIdOrJoinedUserId(@Param("userId") Long userId);

}


