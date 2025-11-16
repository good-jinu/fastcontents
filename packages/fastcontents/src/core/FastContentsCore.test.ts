import { beforeEach, describe, expect, it, vi } from "vitest";
import { FastContentsCore } from "./FastContentsCore";
import type { FetchCallback } from "./types";

interface TestContent {
	id: number;
	title: string;
}

describe("FastContentsCore", () => {
	const mockContents: TestContent[] = [
		{ id: 1, title: "Content 1" },
		{ id: 2, title: "Content 2" },
		{ id: 3, title: "Content 3" },
	];

	const createMockFetch = (
		pages: TestContent[][] = [mockContents],
	): FetchCallback<TestContent> => {
		return vi.fn((params) => {
			const pageIndex = params.offset / (params.limit || 10);
			return Promise.resolve({
				items: pages[pageIndex] || [],
				hasMore: pageIndex < pages.length - 1,
			});
		});
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("initialization", () => {
		it("should initialize with default state", () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({ fetchCallback });

			const state = core.getState();

			expect(state.items).toEqual([]);
			expect(state.isLoading).toBe(false);
			expect(state.isInitialized).toBe(false);
			expect(state.error).toBe(null);
			expect(state.hasMore).toBe(true);
		});

		it("should accept custom configuration", () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({
				fetchCallback,
				initialBatchSize: 20,
				batchSize: 15,
				scrollThreshold: 0.9,
			});

			expect(core).toBeDefined();
		});
	});

	describe("loadMore", () => {
		it("should load initial contents", async () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({ fetchCallback });

			await core.loadMore();

			const state = core.getState();
			expect(state.items).toEqual(mockContents);
			expect(state.isLoading).toBe(false);
			expect(state.isInitialized).toBe(true);
			expect(fetchCallback).toHaveBeenCalledWith({
				offset: 0,
				limit: 10,
			});
		});

		it("should set loading state during fetch", async () => {
			const fetchCallback = vi.fn(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									items: mockContents,
									hasMore: false,
								}),
							50,
						),
					),
			);

			const core = new FastContentsCore({ fetchCallback });

			const loadPromise = core.loadMore();

			// Check loading state immediately
			expect(core.getState().isLoading).toBe(true);

			await loadPromise;

			expect(core.getState().isLoading).toBe(false);
		});

		it("should append items on subsequent loads", async () => {
			const page1 = [
				{ id: 1, title: "Content 1" },
				{ id: 2, title: "Content 2" },
			];
			const page2 = [
				{ id: 3, title: "Content 3" },
				{ id: 4, title: "Content 4" },
			];

			const fetchCallback = createMockFetch([page1, page2]);
			const core = new FastContentsCore({ fetchCallback, batchSize: 2 });

			await core.loadMore();
			expect(core.getState().items).toEqual(page1);

			await core.loadMore();
			expect(core.getState().items).toEqual([...page1, ...page2]);
		});

		it("should not load when already loading", async () => {
			const fetchCallback = vi.fn(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									items: mockContents,
									hasMore: true,
								}),
							50,
						),
					),
			);

			const core = new FastContentsCore({ fetchCallback });

			const promise1 = core.loadMore();
			const promise2 = core.loadMore();

			await Promise.all([promise1, promise2]);

			expect(fetchCallback).toHaveBeenCalledTimes(1);
		});

		it("should not load when hasMore is false", async () => {
			const fetchCallback = createMockFetch([mockContents]);
			const core = new FastContentsCore({ fetchCallback });

			await core.loadMore();
			expect(fetchCallback).toHaveBeenCalledTimes(1);

			await core.loadMore();
			expect(fetchCallback).toHaveBeenCalledTimes(1);
		});

		it("should handle fetch errors", async () => {
			const error = new Error("Fetch failed");
			const fetchCallback = vi.fn(() => Promise.reject(error));
			const core = new FastContentsCore({ fetchCallback });

			await core.loadMore();

			const state = core.getState();
			expect(state.error).toBe(error);
			expect(state.isLoading).toBe(false);
			expect(state.items).toEqual([]);
		});

		it("should use cursor-based pagination when provided", async () => {
			const fetchCallback = vi.fn((_params) =>
				Promise.resolve({
					items: mockContents,
					nextCursor: "cursor-123",
					hasMore: true,
				}),
			);

			const core = new FastContentsCore({ fetchCallback });

			await core.loadMore();

			expect(fetchCallback).toHaveBeenCalledWith({
				offset: 0,
				limit: 10,
			});

			await core.loadMore();

			expect(fetchCallback).toHaveBeenCalledWith({
				offset: 3,
				limit: 10,
				cursor: "cursor-123",
			});
		});
	});

	describe("state subscription", () => {
		it("should notify listeners on state change", async () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({ fetchCallback });

			const listener = vi.fn();
			core.subscribe(listener);

			await core.loadMore();

			expect(listener).toHaveBeenCalled();
			const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
			expect(lastCall.items).toEqual(mockContents);
		});

		it("should allow unsubscribing", async () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({ fetchCallback });

			const listener = vi.fn();
			const unsubscribe = core.subscribe(listener);

			unsubscribe();

			await core.loadMore();

			expect(listener).not.toHaveBeenCalled();
		});

		it("should support multiple listeners", async () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({ fetchCallback });

			const listener1 = vi.fn();
			const listener2 = vi.fn();

			core.subscribe(listener1);
			core.subscribe(listener2);

			await core.loadMore();

			expect(listener1).toHaveBeenCalled();
			expect(listener2).toHaveBeenCalled();
		});
	});

	describe("shouldLoadMore", () => {
		it("should return true when scroll threshold is reached", () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({
				fetchCallback,
				scrollThreshold: 0.8,
			});

			// scrollTop: 800, scrollHeight: 1000, clientHeight: 200
			// scrollPercentage = (800 + 200) / 1000 = 1.0 >= 0.8
			const result = core.shouldLoadMore(800, 1000, 200);

			expect(result).toBe(true);
		});

		it("should return false when scroll threshold is not reached", () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({
				fetchCallback,
				scrollThreshold: 0.8,
			});

			// scrollTop: 500, scrollHeight: 1000, clientHeight: 200
			// scrollPercentage = (500 + 200) / 1000 = 0.7 < 0.8
			const result = core.shouldLoadMore(500, 1000, 200);

			expect(result).toBe(false);
		});

		it("should return false when already loading", async () => {
			const fetchCallback = vi.fn(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									items: mockContents,
									hasMore: true,
								}),
							50,
						),
					),
			);

			const core = new FastContentsCore({ fetchCallback });

			core.loadMore(); // Start loading

			const result = core.shouldLoadMore(800, 1000, 200);

			expect(result).toBe(false);
		});

		it("should return false when hasMore is false", async () => {
			const fetchCallback = createMockFetch([mockContents]);
			const core = new FastContentsCore({ fetchCallback });

			await core.loadMore();

			const result = core.shouldLoadMore(800, 1000, 200);

			expect(result).toBe(false);
		});
	});

	describe("destroy", () => {
		it("should clean up resources", () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({ fetchCallback });

			const listener = vi.fn();
			core.subscribe(listener);

			core.destroy();

			// After destroy, operations should not work
			expect(() => core.loadMore()).not.toThrow();
		});
	});
});
