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
import java.util.LinkedHashMap;
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
                .sorted((g1, g2) -> {
                    if (g1 == GroupType.OTHER) return -1;
                    if (g2 == GroupType.OTHER) return 1;
                    return g1.name().compareTo(g2.name());
                })
                .collect(Collectors.toMap(
                        Enum::name,
                        GroupType::getImageUrl,
                        (oldValue, newValue) -> oldValue,
                        LinkedHashMap::new
                ));
    }

    @GetMapping("/expense-types")
    public Map<String, String> getExpenseTypes() {
        return Arrays.stream(ExpenseType.values())
                .sorted((e1, e2) -> {
                    if (e1 == ExpenseType.OTHER) return -1;
                    if (e2 == ExpenseType.OTHER) return 1;
                    return e1.name().compareTo(e2.name());
                })
                .collect(Collectors.toMap(
                        Enum::name,
                        ExpenseType::getImageUrl,
                        (oldValue, newValue) -> oldValue,
                        LinkedHashMap::new
                ));
    }

    @GetMapping("/currencies")
    public Map<String, String> getCurrencies() {
        return Arrays.stream(Currency.values())
                .sorted((c1, c2) -> {
                    if (c1 == Currency.USD) return -1;
                    if (c2 == Currency.USD) return 1;
                    return c1.name().compareTo(c2.name());
                })
                .collect(Collectors.toMap(
                        Enum::name,
                        Currency::getSymbol,
                        (oldValue, newValue) -> oldValue,
                        LinkedHashMap::new
                ));
    }
}
