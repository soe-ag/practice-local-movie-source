type CacheEntry<T> = { expiresAt: number; value: T };

export const createTtlCache = <T>(ttlMs: number, now = Date.now) => {
  const entries = new Map<string, CacheEntry<T>>();
  return {
    async get(key: string): Promise<T | null> {
      const entry = entries.get(key);
      if (!entry || entry.expiresAt <= now()) {
        entries.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key: string, value: T) {
      entries.set(key, { value, expiresAt: now() + ttlMs });
    },
  };
};

export const createWindowLimiter = (
  limit: number,
  windowMs: number,
  now = Date.now,
) => {
  const requestsByClient = new Map<string, number[]>();
  return {
    async consume(clientKey: string) {
      const currentTime = now();
      const cutoff = currentTime - windowMs;
      const recent = (requestsByClient.get(clientKey) ?? []).filter(
        (timestamp) => timestamp > cutoff,
      );
      if (recent.length >= limit) return false;
      recent.push(currentTime);
      requestsByClient.set(clientKey, recent);
      return true;
    },
  };
};
