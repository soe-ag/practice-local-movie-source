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
});
