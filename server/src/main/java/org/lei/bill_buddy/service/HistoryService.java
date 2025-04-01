package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.model.History;
import org.lei.bill_buddy.repository.HistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoryService {
    private final HistoryRepository historyRepository;

    public void createHistories(List<History> histories) {
        historyRepository.saveAll(histories);
    }

    public List<History> getHistoriesByUserId(Long userId) {
        return historyRepository.getHistoriesByUserId(userId);
    }
}
