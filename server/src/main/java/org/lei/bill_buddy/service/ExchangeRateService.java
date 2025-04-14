package org.lei.bill_buddy.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.HttpURLConnection;
import java.net.URL;

@Slf4j
@RequiredArgsConstructor
@Service
public class ExchangeRateService {
    private static final String API_KEY = "cd78d00051b64abe4803db09";
    private static final String API_URL = "https://v6.exchangerate-api.com/v6/" + API_KEY + "/pair";
    private static final Gson gson = new Gson();

    public BigDecimal convert(BigDecimal amount, BigDecimal rate) {
        return amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getExchangeRate(String fromCurrency, String toCurrency) {
        try {
            String urlStr = String.format("%s/%s/%s", API_URL, fromCurrency.toUpperCase(), toCurrency.toUpperCase());
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            JsonObject json = gson.fromJson(new InputStreamReader(conn.getInputStream()), JsonObject.class);
            if ("success".equalsIgnoreCase(json.get("result").getAsString())) {
                return json.get("conversion_rate").getAsBigDecimal();
            } else {
                log.error("Failed to fetch exchange rate: {}", json);
            }
        } catch (Exception e) {
            log.error("Error fetching exchange rate: {}", e.getMessage());
        }
        return null;
    }
}
