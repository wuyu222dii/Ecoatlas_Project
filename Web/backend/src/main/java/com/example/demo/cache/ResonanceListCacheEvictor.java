package com.example.demo.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.stereotype.Component;

/**
 * Clears all paginated list entries for a user (Spring {@code @CacheEvict} cannot pattern-match keys).
 */
@Component
@RequiredArgsConstructor
public class ResonanceListCacheEvictor {

    public static final String CACHE_ACTIVE_LISTS = "resonanceActiveLists";

    private final CacheManager cacheManager;

    public void evictAllPagesForUser(Long userId) {
        if (userId == null) {
            return;
        }
        Cache cache = cacheManager.getCache(CACHE_ACTIVE_LISTS);
        if (!(cache instanceof CaffeineCache)) {
            return;
        }
        CaffeineCache caffeineCache = (CaffeineCache) cache;
        String prefix = "u" + userId + ":";
        caffeineCache.getNativeCache().asMap().keySet().removeIf(k -> String.valueOf(k).startsWith(prefix));
    }
}
