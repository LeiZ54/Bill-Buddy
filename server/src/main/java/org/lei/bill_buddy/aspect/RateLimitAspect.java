package org.lei.bill_buddy.aspect;

import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.lei.bill_buddy.annotation.RateLimit;
import org.lei.bill_buddy.config.exception.AppException;
import org.lei.bill_buddy.enums.ErrorCode;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final Map<String, Deque<Long>> requestHistory = new ConcurrentHashMap<>();

    @Around("execution(* org.lei.bill_buddy.controller..*(..))")
    public Object rateLimit(ProceedingJoinPoint joinPoint) throws Throwable {
        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        Class<?> declaringClass = method.getDeclaringClass();

        RateLimit methodAnnotation = method.getAnnotation(RateLimit.class);

        RateLimit classAnnotation = declaringClass.getAnnotation(RateLimit.class);

        if (methodAnnotation == null && classAnnotation == null) {
            return joinPoint.proceed();
        }

        RateLimit config = methodAnnotation != null ? methodAnnotation : classAnnotation;
        int maxRequests = config.maxRequests();
        int timeWindowSeconds = config.timeWindowSeconds();

        String key = declaringClass.getName() + "#" + method.getName();

        long now = System.currentTimeMillis();
        Deque<Long> timestamps = requestHistory.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > timeWindowSeconds * 1000L) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
            }
            timestamps.addLast(now);
        }

        return joinPoint.proceed();
    }
}

