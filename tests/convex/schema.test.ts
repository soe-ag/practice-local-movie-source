import { describe, expect, it, vi } from "vitest";

const defineSchemaMock = vi.fn((schema) => schema);
const defineTableMock = vi.fn((shape) => {
  const table = {
    shape,
    indexes: [] as Array<{ name: string; fields: string[] }>,
    index(name: string, fields: string[]) {
      this.indexes.push({ name, fields });
      return this;
    },
  };
  return table;
});

vi.mock("convex/server", () => ({
  defineSchema: defineSchemaMock,
  defineTable: defineTableMock,
}));

vi.mock("convex/values", () => ({
  v: {
    number: () => ({ kind: "number" }),
    string: () => ({ kind: "string" }),
    array: (inner: unknown) => ({ kind: "array", inner }),
    null: () => ({ kind: "null" }),
    optional: (inner: unknown) => ({ kind: "optional", inner }),
    union: (...inners: unknown[]) => ({ kind: "union", inners }),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schema = ((await import("~/convex/schema")).default as any) ?? {};

describe("convex/schema", () => {
  it("defines watchList and favoriteList tables", () => {
    expect(defineSchemaMock).toHaveBeenCalledTimes(1);
    expect(schema.watchList).toBeTruthy();
    expect(schema.favoriteList).toBeTruthy();
  });

  it("defines by_movie_id index on both tables", () => {
    expect(schema.watchList.indexes).toEqual([
      { name: "by_movie_id", fields: ["id"] },
    ]);
    expect(schema.favoriteList.indexes).toEqual([
      { name: "by_movie_id", fields: ["id"] },
    ]);
  });

  it("allows addedAt as string or number in both tables", () => {
    expect(schema.watchList.shape.addedAt.kind).toBe("union");
    expect(schema.watchList.shape.addedAt.inners).toHaveLength(2);

    expect(schema.favoriteList.shape.addedAt.kind).toBe("union");
    expect(schema.favoriteList.shape.addedAt.inners).toHaveLength(2);
  });

  it("defines optional genres array in both tables", () => {
    expect(schema.watchList.shape.genres.kind).toBe("optional");
    expect(schema.watchList.shape.genres.inner.kind).toBe("array");

    expect(schema.favoriteList.shape.genres.kind).toBe("optional");
    expect(schema.favoriteList.shape.genres.inner.kind).toBe("array");
  });
});
