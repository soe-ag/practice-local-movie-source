import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/convex/_generated/server", () => ({
  query: (config: unknown) => config,
  mutation: (config: unknown) => config,
}));

vi.mock("convex/values", () => ({
  v: {
    number: () => "number",
    string: () => "string",
    union: (...args: unknown[]) => ({ type: "union", args }),
    null: () => "null",
    optional: (arg: unknown) => ({ type: "optional", arg }),
    array: (arg: unknown) => ({ type: "array", arg }),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mod = (await import("~/convex/watchList")) as any;

const baseMovieArgs = {
  id: 42,
  title: "The Answer",
  posterUrl: "/poster.jpg",
  rating: 8.5,
  release: 2024,
  type: "movie",
  genres: ["Action", "Fantasy"],
  overview: "sample",
};

const makeCtx = () => {
  const first = vi.fn();
  const withIndex = vi.fn(() => ({ first }));
  const collect = vi.fn();
  const query = vi.fn((table: string) => {
    if (table === "watchList") {
      return { withIndex, collect };
    }
    throw new Error(`Unexpected table: ${table}`);
  });
  const insert = vi.fn();
  const del = vi.fn();

  return {
    ctx: {
      db: {
        query,
        insert,
        delete: del,
      },
    },
    first,
    collect,
    insert,
    del,
  };
};

describe("convex/watchList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("get collects all watchList rows", async () => {
    const { ctx, collect } = makeCtx();
    const expected = [{ _id: "x1", id: 1 }];
    collect.mockResolvedValue(expected);

    const result = await mod.get.handler(ctx);

    expect(result).toEqual(expected);
    expect(collect).toHaveBeenCalledTimes(1);
  });

  it("add throws when movie already exists", async () => {
    const { ctx, first } = makeCtx();
    first.mockResolvedValue({ _id: "exists", id: baseMovieArgs.id });

    await expect(mod.add.handler(ctx, baseMovieArgs)).rejects.toThrow(
      "Movie already in watchlist",
    );
  });

  it("add inserts movie with numeric addedAt when not present", async () => {
    const { ctx, first, insert } = makeCtx();
    first.mockResolvedValue(null);
    insert.mockResolvedValue("new_doc_id");

    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    const result = await mod.add.handler(ctx, baseMovieArgs);

    expect(nowSpy).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith("watchList", {
      ...baseMovieArgs,
      addedAt: 1700000000000,
    });
    expect(result).toBe("new_doc_id");
  });

  it("remove throws when movie does not exist", async () => {
    const { ctx, first } = makeCtx();
    first.mockResolvedValue(null);

    await expect(mod.remove.handler(ctx, { id: 100 })).rejects.toThrow(
      "Movie not found in watchlist",
    );
  });

  it("remove deletes found movie and returns success", async () => {
    const { ctx, first, del } = makeCtx();
    first.mockResolvedValue({ _id: "doc_1", id: 42 });

    const result = await mod.remove.handler(ctx, { id: 42 });

    expect(del).toHaveBeenCalledWith("doc_1");
    expect(result).toEqual({ success: true });
  });
});
