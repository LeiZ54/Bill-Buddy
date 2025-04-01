package org.lei.bill_buddy.controller;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.HistoryDTO;
import org.lei.bill_buddy.model.History;
import org.lei.bill_buddy.service.HistoryService;
import org.lei.bill_buddy.service.UserService;
import org.lei.bill_buddy.util.DtoConvertorUtil;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/histories")
public class HistoryController {
    private final HistoryService historyService;
    private final UserService userService;
    private final DtoConvertorUtil dtoConvertor;

    @GetMapping
    public List<HistoryDTO> getHistoriesByUserId() {
        List<History> histories = historyService.getHistoriesByUserId(userService.getCurrentUser().getId());
        return histories.stream().map(dtoConvertor::convertHistoryToHistoryDTO).toList();
    }
}
