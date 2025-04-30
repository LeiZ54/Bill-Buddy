package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.util.ExchangeRateFetcher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateService {

    private final StringRedisTemplate redis;
    private final ExchangeRateFetcher fetcher;

    private static final long TTL_SECONDS = 6 * 60 * 60;

    public BigDecimal convert(BigDecimal amt, Currency from, Currency to) {
        return amt.multiply(getRate(from, to)).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getRate(Currency from, Currency to) {
        if (from == to) return BigDecimal.ONE;

        String hKey = "fx:" + from;
        String field = to.name();

        String cached = (String) redis.opsForHash().get(hKey, field);
        if (cached != null) return new BigDecimal(cached);

        BigDecimal fresh = fetcher.fetch(from, to);
        redis.opsForHash().put(hKey, field, fresh.toPlainString());
        redis.expire(hKey, Duration.ofSeconds(TTL_SECONDS));
        return fresh;
    }
}

