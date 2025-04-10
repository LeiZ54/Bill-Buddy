package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.model.History;
import org.lei.bill_buddy.repository.HistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HistoryService {

    private final HistoryRepository historyRepository;

    public void createHistories(List<History> histories) {
        log.info("Creating {} history records", histories.size());
        historyRepository.saveAll(histories);
        log.debug("Histories created: {}", histories);
    }

    public List<History> getHistoriesByUserId(Long userId) {
        log.debug("Fetching histories for user ID: {}", userId);
        List<History> result = historyRepository.getHistoriesByUserId(userId);
        log.info("Fetched {} history records for user ID: {}", result.size(), userId);
        return result;
    }
}
