package org.lei.bill_buddy.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.ErrorCode;
import org.springframework.stereotype.Service;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateService {

    private static final String API_KEY = "cd78d00051b64abe4803db09";
    private static final String API_URL = "https://v6.exchangerate-api.com/v6/" + API_KEY + "/pair";
    private static final Gson GSON = new Gson();

    private final ConcurrentMap<String, CachedRate> cache = new ConcurrentHashMap<>();
    private static final long TTL = 6 * 60 * 60 * 1000;

    public BigDecimal convert(BigDecimal amount, Currency fromCurrency, Currency toCurrency) {
        BigDecimal rate = getRate(fromCurrency, toCurrency);
        return amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getRate(Currency from, Currency to) {
        if (from == to) return BigDecimal.ONE;
        String key = from + "->" + to;

        CachedRate hit = cache.get(key);
        long now = System.currentTimeMillis();

        if (hit != null && now - hit.timestamp < TTL) {
            return hit.rate;
        }

        BigDecimal fresh = fetchFromApi(from, to);
        cache.put(key, new CachedRate(fresh, now));
        return fresh;
    }

    private BigDecimal fetchFromApi(Currency from, Currency to) {
        try {
            String urlStr = String.format("%s/%s/%s", API_URL, from, to);
            HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setRequestMethod("GET");

            JsonObject json = GSON.fromJson(new InputStreamReader(conn.getInputStream()), JsonObject.class);
            if ("success".equalsIgnoreCase(json.get("result").getAsString())) {
                return json.get("conversion_rate").getAsBigDecimal();
            }
            log.error("fetch rate failed: {}", json);
        } catch (Exception e) {
            log.error("Error fetch rate: {}", e.getMessage());
        }
        throw new AppException(ErrorCode.EXCHANGE_RATE_FETCH_FAILED);
    }

    private record CachedRate(BigDecimal rate, long timestamp) {
    }
}

