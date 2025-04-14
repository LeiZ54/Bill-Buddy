package org.lei.bill_buddy.enums;

import lombok.Getter;

@Getter
public enum ExpenseType {
    FOOD("https://ibb.co/pvjLBFp8"),
    TRANSPORT("https://ibb.co/xKkyWR1W"),
    HOUSING("https://ibb.co/WNjT0yq0"),
    ENTERTAINMENT("https://ibb.co/PsgVQYzG"),
    HEALTH("https://ibb.co/wZQSPhxV"),
    SHOPPING("https://ibb.co/SXfTMZDw"),
    EDUCATION("https://ibb.co/mrQkmgkc"),
    GIFT("https://ibb.co/S7MqpGQv"),
    SUBSCRIPTION("https://ibb.co/k6krgBgn"),
    SETTLE_UP("https://ibb.co/J02sgZT"),
    UTILITIES("https://ibb.co/99G4P0ch"),
    OTHER("https://ibb.co/TM8RtfDp");

    private final String imageUrl;

    ExpenseType(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
