package org.lei.bill_buddy.DTO;

import lombok.Data;

import java.util.Map;

@Data
public class ExchangeRateResponse {
    private String baseCode;
    private Map<String, Double> conversionRates;
}
