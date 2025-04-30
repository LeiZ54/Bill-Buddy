package org.lei.bill_buddy.util;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.ErrorCode;
import org.springframework.stereotype.Component;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URL;

@Component
@Slf4j
public class ExchangeRateFetcher {

    private static final String API_KEY = "cd78d00051b64abe4803db09";
    private static final String API_URL = "https://v6.exchangerate-api.com/v6/" + API_KEY + "/pair";
    private static final Gson GSON = new Gson();

    public BigDecimal fetch(Currency from, Currency to) {
        try {
            String urlStr = API_URL + "/" + from + "/" + to;
            HttpURLConnection c = (HttpURLConnection) new URL(urlStr).openConnection();
            c.setRequestMethod("GET");

            JsonObject json = GSON.fromJson(new InputStreamReader(c.getInputStream()), JsonObject.class);
            if ("success".equalsIgnoreCase(json.get("result").getAsString())) {
                return json.get("conversion_rate").getAsBigDecimal();
            }
            log.error("Fetch failed: {}", json);
        } catch (Exception e) {
            log.error("HTTP error", e);
        }
        throw new AppException(ErrorCode.EXCHANGE_RATE_FETCH_FAILED);
    }
}

