package org.lei.bill_buddy.util;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RateLimiterUtil {

    private final StringRedisTemplate redisTemplate;

    public boolean isAllowed(String ip, int seconds) {
        String PREFIX = "send_email:";
        String key = PREFIX + ip;
        Boolean exists = redisTemplate.hasKey(key);
        if (exists) {
            return false;
        }
        redisTemplate.opsForValue().set(key, "1", Duration.ofSeconds(seconds));
        return true;
    }
}

