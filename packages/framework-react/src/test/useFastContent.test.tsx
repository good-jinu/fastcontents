import { act, renderHook, waitFor } from "@testing-library/react";
import type { FetchCallback, FetchResult } from "fastcontents";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFastContent } from "../useFastContent";

interface TestContent {
	id: number;
	title: string;
}

describe("useFastContent", () => {
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

	it("should initialize with default state", async () => {
		const fetchCallback = vi.fn(
			() =>
				new Promise<FetchResult<TestContent>>((resolve) =>
					setTimeout(
						() =>
							resolve({
								items: mockContents,
								hasMore: false,
							}),
						10, // small delay
					),
				),
		);
		const { result } = renderHook(() => useFastContent({ fetchCallback }));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(true);
		});

		expect(result.current.items).toEqual([]);
		expect(result.current.isInitialized).toBe(false);
		expect(result.current.error).toBe(null);
		expect(result.current.hasMore).toBe(true);
	});

	it("should load initial contents on mount", async () => {
		const fetchCallback = createMockFetch();
		const { result } = renderHook(() => useFastContent({ fetchCallback }));

		await waitFor(() => {
			expect(result.current.isInitialized).toBe(true);
		});

		expect(result.current.items).toEqual(mockContents);
		expect(result.current.isLoading).toBe(false);
		expect(fetchCallback).toHaveBeenCalledWith({
			offset: 0,
			limit: 10,
		});
	});

	it("should provide loadMore function", async () => {
		const page1 = [
			{ id: 1, title: "Content 1" },
			{ id: 2, title: "Content 2" },
		];
		const page2 = [
			{ id: 3, title: "Content 3" },
			{ id: 4, title: "Content 4" },
		];

		const fetchCallback = createMockFetch([page1, page2]);
		const { result } = renderHook(() =>
			useFastContent({ fetchCallback, batchSize: 2 }),
		);

		await waitFor(() => {
			expect(result.current.items).toEqual(page1);
		});

		await act(async () => {
			await result.current.loadMore();
		});

		expect(result.current.items).toEqual([...page1, ...page2]);
	});

	it("should show loading state", async () => {
		const fetchCallback = vi.fn(
			() =>
				new Promise<FetchResult<TestContent>>((resolve) =>
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

		const { result } = renderHook(() => useFastContent({ fetchCallback }));

		// Should be loading initially
		await waitFor(() => {
			expect(result.current.isLoading).toBe(true);
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.items).toEqual(mockContents);
	});

	it("should handle errors", async () => {
		const error = new Error("Fetch failed");
		const fetchCallback = vi.fn(() => Promise.reject(error));

		const { result } = renderHook(() => useFastContent({ fetchCallback }));

		await waitFor(() => {
			expect(result.current.error).toBe(error);
		});

		expect(result.current.items).toEqual([]);
		expect(result.current.isLoading).toBe(false);
	});

	it("should cleanup on unmount", async () => {
		const fetchCallback = createMockFetch();
		const { unmount } = renderHook(() => useFastContent({ fetchCallback }));

		await waitFor(() => {
			expect(fetchCallback).toHaveBeenCalled();
		});

		expect(() => unmount()).not.toThrow();
	});

	it("should accept custom configuration", async () => {
		const fetchCallback = createMockFetch();
		const { result } = renderHook(() =>
			useFastContent({
				fetchCallback,
				initialBatchSize: 20,
				batchSize: 15,
				scrollThreshold: 0.9,
			}),
		);

		await waitFor(() => {
			expect(result.current.isInitialized).toBe(true);
		});

		expect(result.current.items).toEqual(mockContents);
	});

	it("should not reinitialize on rerender with same config", async () => {
		const fetchCallback = createMockFetch();
		const config = { fetchCallback };

		const { rerender } = renderHook(() => useFastContent(config));

		await waitFor(() => {
			expect(fetchCallback).toHaveBeenCalledTimes(1);
		});

		rerender();

		// Should not fetch again
		expect(fetchCallback).toHaveBeenCalledTimes(1);
	});
});
