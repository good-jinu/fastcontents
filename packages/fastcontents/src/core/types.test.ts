import { describe, expect, it } from "vitest";
import type { ContentState, FetchResult, PaginationParams } from "./types";

describe("Types", () => {
	it("should create valid PaginationParams", () => {
		const params: PaginationParams = {
			offset: 0,
			limit: 10,
			cursor: "abc123",
		};

		expect(params.offset).toBe(0);
		expect(params.limit).toBe(10);
		expect(params.cursor).toBe("abc123");
	});

	it("should create valid FetchResult", () => {
		const result: FetchResult<string> = {
			items: ["item1", "item2"],
			hasMore: true,
			nextCursor: "next123",
		};

		expect(result.items).toHaveLength(2);
		expect(result.hasMore).toBe(true);
		expect(result.nextCursor).toBe("next123");
	});

	it("should create valid ContentState", () => {
		const state: ContentState<number> = {
			items: [1, 2, 3],
			isLoading: false,
			isInitialized: true,
			error: null,
			hasMore: true,
		};

		expect(state.items).toEqual([1, 2, 3]);
		expect(state.isLoading).toBe(false);
		expect(state.isInitialized).toBe(true);
		expect(state.error).toBeNull();
		expect(state.hasMore).toBe(true);
	});
});
