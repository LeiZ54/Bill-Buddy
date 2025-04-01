package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.model.History;
import org.lei.bill_buddy.repository.HistoryRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HistoryService {
    private final HistoryRepository historyRepository;
    private final GroupService groupService;
    private final UserService userService;

    public History createHistory(History history) {
        return historyRepository.save(history);
    }
}
