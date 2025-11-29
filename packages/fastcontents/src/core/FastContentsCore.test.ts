import { beforeEach, describe, expect, it, vi } from "vitest";
import { FastContentsCore } from "./FastContentsCore";
import type { FetchCallback, FetchResult } from "./types";

interface TestContent {
	id: number;
	title: string;
}

describe("FastContentsCore", () => {
	// Helper to generate distinct items
	const generateItems = (startId: number, count: number): TestContent[] => {
		return Array.from({ length: count }, (_, i) => ({
			id: startId + i,
			title: `Content ${startId + i}`,
		}));
	};

	const mockPage1 = generateItems(1, 3); // IDs 1, 2, 3
	const mockPage2 = generateItems(4, 3); // IDs 4, 5, 6

	const createMockFetch = (
		pages: TestContent[][] = [mockPage1],
	): FetchCallback<TestContent> => {
		return vi.fn((params) => {
			// Simple mock logic: if offset is 0 return page 1, if 3 return page 2, etc.
			const flatItems = pages.flat();
			const slice = flatItems.slice(
				params.offset,
				params.offset + params.limit,
			);

			// Determine if there are actual items left in the "database" (pages)
			// relative to what we just returned
			const endOfSlice = params.offset + slice.length;
			const totalAvailable = flatItems.length;
			// In a real scenario, the server decides hasMore.
			// Here we assume if we returned full page, there might be more,
			// unless we are at the absolute end of provided mock data.
			const hasMore = endOfSlice < totalAvailable;

			return Promise.resolve({
				items: slice,
				hasMore: hasMore,
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
			expect(state.currentIndex).toBe(0); // New assertion
			expect(state.isLoading).toBe(false);
			expect(state.isInitialized).toBe(false);
			expect(state.error).toBe(null);
			expect(state.hasMore).toBe(true);
		});

		it("should accept custom configuration", () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({
				fetchCallback,
				initialBatchSize: 5,
				batchSize: 5,
			});

			expect(core).toBeDefined();
			// We can implicitly check if config worked by triggering load
			// and checking fetch params, handled in loadMore tests
		});
	});

	describe("loadMore (Internal & Initial)", () => {
		it("should load initial contents", async () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({
				fetchCallback,
				initialBatchSize: 3,
			});

			await core.loadMore();

			const state = core.getState();
			expect(state.items).toEqual(mockPage1);
			expect(state.isLoading).toBe(false);
			expect(state.isInitialized).toBe(true);
			expect(fetchCallback).toHaveBeenCalledWith({
				offset: 0,
				limit: 3,
			});
		});

		it("should set loading state during fetch", async () => {
			const fetchCallback = vi.fn(
				() =>
					new Promise<FetchResult<unknown>>((resolve) =>
						setTimeout(
							() =>
								resolve({
									items: mockPage1,
									hasMore: false,
								}),
							50,
						),
					),
			);

			const core = new FastContentsCore({ fetchCallback });
			const loadPromise = core.loadMore();

			expect(core.getState().isLoading).toBe(true);
			await loadPromise;
			expect(core.getState().isLoading).toBe(false);
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
	});

	describe("Navigation & Buffering", () => {
		it("should advance index on goNext", async () => {
			const fetchCallback = createMockFetch([mockPage1]); // 3 items
			const core = new FastContentsCore({ fetchCallback });

			await core.loadMore(); // Load initial
			expect(core.getState().currentIndex).toBe(0);

			await core.goNext();
			expect(core.getState().currentIndex).toBe(1);
		});

		it("should decrease index on goPrev", async () => {
			const fetchCallback = createMockFetch([mockPage1]);
			const core = new FastContentsCore({ fetchCallback });
			await core.loadMore();

			await core.goNext(); // Index 1
			expect(core.getState().currentIndex).toBe(1);

			core.goPrev();
			expect(core.getState().currentIndex).toBe(0);
		});

		it("should not goPrev below 0", async () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({ fetchCallback });
			await core.loadMore();

			expect(core.getState().currentIndex).toBe(0);
			core.goPrev();
			expect(core.getState().currentIndex).toBe(0);
		});

		it("should NOT goNext if at end of list and hasMore is false", async () => {
			// Setup: Only 1 page of data exists.
			const fetchCallback = createMockFetch([mockPage1]);
			const core = new FastContentsCore({ fetchCallback });
			await core.loadMore();

			// Advance to end: Index 0 -> 1 -> 2
			await core.goNext();
			await core.goNext();

			const state = core.getState();
			expect(state.currentIndex).toBe(2);
			expect(state.items.length).toBe(3);

			// Try to go past end
			await core.goNext();
			expect(core.getState().currentIndex).toBe(2);
		});

		it("should automatically fetch more data when approaching end (Buffering)", async () => {
			// Setup: Page 1 and Page 2 exist.
			const fetchCallback = createMockFetch([mockPage1, mockPage2]);
			const core = new FastContentsCore({
				fetchCallback,
				initialBatchSize: 3,
				batchSize: 3,
			});

			await core.loadMore(); // Loads [1, 2, 3]
			expect(fetchCallback).toHaveBeenCalledTimes(1);
			expect(core.getState().items.length).toBe(3);

			// Move to index 1.
			// Logic: Remaining items = 3 - (1 + 1) = 1.
			// Threshold is < 2. Should trigger loadMore.
			await core.goNext();

			expect(core.getState().currentIndex).toBe(1);

			// Validate that new items were fetched
			expect(fetchCallback).toHaveBeenCalledTimes(2);
			expect(core.getState().items.length).toBe(6); // [1,2,3,4,5,6]

			// Verify items were appended correctly
			expect(core.getState().items[3].id).toBe(4);
		});

		it("should not fetch more if buffer is sufficient", async () => {
			// Setup: Load a large initial batch so we don't need to fetch immediately
			const largePage = generateItems(1, 10);
			const fetchCallback = createMockFetch([largePage, mockPage2]);

			const core = new FastContentsCore({
				fetchCallback,
				initialBatchSize: 10,
			});

			await core.loadMore();
			expect(fetchCallback).toHaveBeenCalledTimes(1);

			// Move 0 -> 1
			await core.goNext();

			// Remaining = 10 - 2 = 8. This is plenty. Should NOT fetch.
			expect(fetchCallback).toHaveBeenCalledTimes(1);
		});
	});

	describe("state subscription", () => {
		it("should notify listeners on navigation", async () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({ fetchCallback });
			await core.loadMore();

			const listener = vi.fn();
			core.subscribe(listener);

			await core.goNext();

			expect(listener).toHaveBeenCalled();
			const lastState = listener.mock.calls[listener.mock.calls.length - 1][0];
			expect(lastState.currentIndex).toBe(1);
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
	});

	describe("destroy", () => {
		it("should clean up resources", () => {
			const fetchCallback = createMockFetch();
			const core = new FastContentsCore({ fetchCallback });

			const listener = vi.fn();
			core.subscribe(listener);

			core.destroy();

			// Operations shouldn't crash, but listeners shouldn't fire
			core.goPrev();
			expect(listener).not.toHaveBeenCalled();
		});
	});
});
