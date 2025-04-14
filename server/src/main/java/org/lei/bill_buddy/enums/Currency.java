package org.lei.bill_buddy.enums;

import lombok.Getter;

@Getter
public enum Currency {
    EUR("€"),
    USD("$"),
    GBP("£"),
    JPY("¥"),
    CNY("¥"),
    KRW("₩"),
    AUD("A$"),
    CAD("C$");

    private final String symbol;

    Currency(String symbol) {
        this.symbol = symbol;
    }
}
