package org.lei.bill_buddy.controller;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.annotation.RateLimit;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.ExpenseType;
import org.lei.bill_buddy.enums.GroupType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@RateLimit
@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
public class CommonController {
    @GetMapping("/group-types")
    public Map<String, String> getGroupTypes() {
        return Arrays.stream(GroupType.values())
                .collect(Collectors.toMap(Enum::name, GroupType::getImageUrl));
    }

    @GetMapping("/expense-types")
    public Map<String, String> getExpenseTypes() {
        return Arrays.stream(ExpenseType.values())
                .collect(Collectors.toMap(Enum::name, ExpenseType::getImageUrl));
    }

    @GetMapping("/currencies")
    public Map<String, String> getCurrencies() {
        return Arrays.stream(Currency.values())
                .collect(Collectors.toMap(Enum::name, Currency::getSymbol));
    }
}
