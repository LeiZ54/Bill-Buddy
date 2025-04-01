package org.lei.bill_buddy.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class ExpanseSummaryService {
    private final UserService userService;
    private final ExpenseService expenseService;
    private final HistoryService historyService;
}
