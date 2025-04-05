package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByIdAndDeletedFalse(Long id);

    Optional<User> findByEmailAndDeletedFalse(String email);

    List<User> findByEmailContainingIgnoreCaseAndDeletedFalse(String email);

    List<User> findByIdInAndDeletedFalse(List<Long> ids);

    boolean existsByEmailAndDeletedFalse(String email);
}

