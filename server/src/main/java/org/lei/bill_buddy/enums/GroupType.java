package org.lei.bill_buddy.enums;

import lombok.Getter;

@Getter
public enum GroupType {
    TRIP("https://ibb.co/prJfHycy"),
    PARTY("https://ibb.co/8nDc69Nq"),
    DAILY("https://ibb.co/C5MdgbTY"),
    OTHER("https://ibb.co/QFzt0mxn");

    private final String imageUrl;

    GroupType(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
