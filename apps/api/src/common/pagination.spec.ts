import { paginationParams, toPaginatedResult } from "./pagination";

describe("pagination", () => {
  describe("paginationParams", () => {
    it("clamps page and pageSize and computes skip", () => {
      expect(paginationParams({ page: 0, pageSize: 200 })).toEqual({
        page: 1,
        pageSize: 100,
        skip: 0,
      });
      expect(paginationParams({ page: 3, pageSize: 10 })).toEqual({
        page: 3,
        pageSize: 10,
        skip: 20,
      });
    });

    it("uses defaults when page and pageSize are missing", () => {
      expect(paginationParams({})).toEqual({ page: 1, pageSize: 20, skip: 0 });
    });
  });

  describe("toPaginatedResult", () => {
    it("wraps items with pagination metadata", () => {
      expect(toPaginatedResult(["a"], 1, 1, 20)).toEqual({
        items: ["a"],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    });
  });
});
