package org.lei.bill_buddy.repository;

import org.lei.bill_buddy.model.History;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryRepository extends JpaRepository<History, Long> {
    List<History> getHistoriesByUserId(Long userId);
}
