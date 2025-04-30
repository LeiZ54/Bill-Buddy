package org.lei.bill_buddy.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.util.ExchangeRateFetcher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
public class FxRateScheduler {

    private static final long TTL_SECONDS = 6 * 60 * 60;
    private final ExchangeRateFetcher fetcher;

    private final StringRedisTemplate redis;

    @Scheduled(fixedRateString = "PT6H", initialDelay = 0)
    public void refreshRates() {
        log.info("Refreshing FX rates for ALL currency pairs…");
        try {
            Currency[] all = Currency.values();

            for (Currency base : all) {
                String hashKey = "fx:" + base;
                for (Currency target : all) {
                    if (base == target) continue;

                    BigDecimal rate = fetcher.fetch(base, target);
                    redis.opsForHash().put(hashKey, target.name(), rate.toPlainString());
                }
                redis.expire(hashKey, Duration.ofSeconds(TTL_SECONDS));
            }

            log.info("FX rates refreshed for {} currencies, ~{} pairs",
                    all.length, (all.length * (all.length - 1)));
        } catch (Exception e) {
            log.error("Global FX refresh failed", e);
        }
    }
}