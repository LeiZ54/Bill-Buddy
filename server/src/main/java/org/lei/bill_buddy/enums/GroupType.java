package org.lei.bill_buddy.enums;

import lombok.Getter;

@Getter
public enum GroupType {
    TRIP("https://i.ibb.co/XkS7n818/GROUP-TRIP.png"),
    PARTY("https://i.ibb.co/LDz5n1Ym/GROUP-PARTY.png"),
    DAILY("https://i.ibb.co/gMP1NSBf/GROUP-DAILY.png"),
    OTHER("https://i.ibb.co/GvBNmPrk/GROUP-OTHER.png");

    private final String imageUrl;

    GroupType(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
