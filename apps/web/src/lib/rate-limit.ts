import { LRUCache } from 'lru-cache';

type RateLimitContext = {
    ip: string;
    limit?: number;
    window?: number;
};

const tokenCache = new LRUCache<string, number>({
    max: 500, // Max 500 unique IPs tracked
    ttl: 60 * 1000, // Window size: 1 minute default
});

export function rateLimit(context: RateLimitContext) {
    const { ip, limit = 10, window = 60 * 1000 } = context;

    const tokenCount = tokenCache.get(ip) || 0;

    if (tokenCount >= limit) {
        return { success: false, limit, remaining: 0 };
    }

    tokenCache.set(ip, tokenCount + 1, { ttl: window });

    return {
        success: true,
        limit,
        remaining: limit - (tokenCount + 1)
    };
}
