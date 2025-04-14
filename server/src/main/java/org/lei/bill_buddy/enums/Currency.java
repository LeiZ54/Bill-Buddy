package org.lei.bill_buddy.enums;

import lombok.Getter;

@Getter
public enum Currency {
    EUR("Euro", "€"),
    USD("US Dollar", "$"),
    GBP("British Pound", "£"),
    JPY("Japanese Yen", "¥"),
    CNY("Chinese Yuan", "¥"),
    KRW("South Korean Won", "₩"),
    AUD("Australian Dollar", "A$"),
    CAD("Canadian Dollar", "C$");

    private final String name;
    private final String symbol;

    Currency(String name, String symbol) {
        this.name = name;
        this.symbol = symbol;
    }
}
