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
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mod = (await import("~/convex/favoriteList")) as any;

const baseMovieArgs = {
  id: 11,
  title: "Favorite One",
  posterUrl: "/favorite.jpg",
  rating: 9.2,
  release: 2023,
  type: "movie",
  overview: "favorite overview",
};

const makeCtx = () => {
  const first = vi.fn();
  const withIndex = vi.fn(() => ({ first }));
  const collect = vi.fn();
  const query = vi.fn((table: string) => {
    if (table === "favoriteList") {
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

describe("convex/favoriteList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("get collects all favoriteList rows", async () => {
    const { ctx, collect } = makeCtx();
    const expected = [{ _id: "fav_1", id: 1 }];
    collect.mockResolvedValue(expected);

    const result = await mod.get.handler(ctx);

    expect(result).toEqual(expected);
    expect(collect).toHaveBeenCalledTimes(1);
  });

  it("add throws when movie already exists", async () => {
    const { ctx, first } = makeCtx();
    first.mockResolvedValue({ _id: "exists", id: baseMovieArgs.id });

    await expect(mod.add.handler(ctx, baseMovieArgs)).rejects.toThrow(
      "Movie already in favorites",
    );
  });

  it("add inserts movie with numeric addedAt when not present", async () => {
    const { ctx, first, insert } = makeCtx();
    first.mockResolvedValue(null);
    insert.mockResolvedValue("fav_new_doc_id");

    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    const result = await mod.add.handler(ctx, baseMovieArgs);

    expect(nowSpy).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith("favoriteList", {
      ...baseMovieArgs,
      addedAt: 1700000000000,
    });
    expect(result).toBe("fav_new_doc_id");
  });

  it("remove throws when movie does not exist", async () => {
    const { ctx, first } = makeCtx();
    first.mockResolvedValue(null);

    await expect(mod.remove.handler(ctx, { id: 100 })).rejects.toThrow(
      "Movie not found in favorites",
    );
  });

  it("remove deletes found movie and returns success", async () => {
    const { ctx, first, del } = makeCtx();
    first.mockResolvedValue({ _id: "fav_doc_1", id: 11 });

    const result = await mod.remove.handler(ctx, { id: 11 });

    expect(del).toHaveBeenCalledWith("fav_doc_1");
    expect(result).toEqual({ success: true });
  });
});
