import { describe, expect, it } from "vitest";
import {
  createTtlCache,
  createWindowLimiter,
} from "~/server/utils/recommendationInfrastructure";

describe("recommendation infrastructure", () => {
  it("expires cached AI responses after 24 hours", async () => {
    let now = 0;
    const cache = createTtlCache<string>(24 * 60 * 60 * 1000, () => now);
    await cache.set("seed", "response");

    now = 24 * 60 * 60 * 1000 - 1;
    await expect(cache.get("seed")).resolves.toBe("response");
    now += 1;
    await expect(cache.get("seed")).resolves.toBeNull();
  });

  it("allows five uncached requests per client each hour", async () => {
    let now = 100;
    const limiter = createWindowLimiter(5, 60 * 60 * 1000, () => now);

    for (let request = 0; request < 5; request += 1) {
      await expect(limiter.consume("client")).resolves.toBe(true);
    }
    await expect(limiter.consume("client")).resolves.toBe(false);
    now += 60 * 60 * 1000 + 1;
    await expect(limiter.consume("client")).resolves.toBe(true);
  });

  it("reports when a rate-limited client gets a free slot again", async () => {
    const hour = 60 * 60 * 1000;
    let now = 1_000;
    const limiter = createWindowLimiter(2, hour, () => now);

    await expect(limiter.retryAfterMs("client")).resolves.toBe(0);
    await limiter.consume("client"); // at t=1000
    now = 11_000;
    await limiter.consume("client"); // at t=11000
    await expect(limiter.consume("client")).resolves.toBe(false);

    now = 21_000;
    // the oldest request (t=1000) expires at 1000 + 1h
    await expect(limiter.retryAfterMs("client")).resolves.toBe(1_000 + hour - 21_000);
    now = 1_000 + hour + 1;
    await expect(limiter.retryAfterMs("client")).resolves.toBe(0);
  });

  it("honours a configured limit", async () => {
    const limiter = createWindowLimiter(100, 60 * 60 * 1000, () => 0);
    for (let request = 0; request < 100; request += 1) {
      await expect(limiter.consume("client")).resolves.toBe(true);
    }
    await expect(limiter.consume("client")).resolves.toBe(false);
  });
});
