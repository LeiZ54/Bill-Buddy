package org.lei.bill_buddy.enums;

import lombok.Getter;

@Getter
public enum ExpenseType {
    FOOD("https://i.ibb.co/RpTDkwWm/FOOD.png"),
    TRANSPORT("https://i.ibb.co/LDFMm2xm/TRANSPORT.png"),
    HOUSING("https://i.ibb.co/CpDr67N6/HOUSING.png"),
    ENTERTAINMENT("https://i.ibb.co/4wp0dfgR/ENTERTAINMENT.png"),
    HEALTH("https://i.ibb.co/Kcs2fx3d/HEALTH.png"),
    SHOPPING("https://i.ibb.co/BVnDQYH2/SHOPPING.png"),
    EDUCATION("https://i.ibb.co/fVmfbLfx/EDUCATION.png"),
    GIFT("https://i.ibb.co/5xSqVwYc/GIFT.png"),
    SUBSCRIPTION("https://i.ibb.co/Hp1MD4Dv/SUBSCRIPTION.png"),
    SETTLE_UP("https://i.ibb.co/DskRTdF/SETTLE-UP.png"),
    UTILITIES("https://i.ibb.co/VW3C6GJx/UTILITIES.png"),
    OTHER("https://i.ibb.co/F4wJzrkN/OTHER.png");

    private final String imageUrl;

    ExpenseType(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
