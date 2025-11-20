import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FetchCallback, FetchResult } from "fastcontents";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FastContent } from "../FastContent";

interface TestContent {
	id: number;
	title: string;
}

describe("FastContent", () => {
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

	const mockRenderer = vi.fn((content: TestContent, index: number) => (
		<div key={index} data-testid={`content-${content.id}`}>
			{content.title}
		</div>
	));

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render initial contents", async () => {
		const fetchCallback = createMockFetch();

		render(
			<FastContent fetchCallback={fetchCallback} renderer={mockRenderer} />,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		expect(fetchCallback).toHaveBeenCalledWith({
			offset: 0,
			limit: 10,
		});
		expect(screen.getByText("Content 1")).toBeInTheDocument();
		expect(screen.getByText("Content 2")).toBeInTheDocument();
		expect(screen.getByText("Content 3")).toBeInTheDocument();
	});

	it("should call renderer for each content item", async () => {
		const fetchCallback = createMockFetch();

		render(
			<FastContent fetchCallback={fetchCallback} renderer={mockRenderer} />,
		);

		await waitFor(() => {
			expect(mockRenderer).toHaveBeenCalledTimes(3);
		});

		expect(mockRenderer).toHaveBeenCalledWith(mockContents[0], 0);
		expect(mockRenderer).toHaveBeenCalledWith(mockContents[1], 1);
		expect(mockRenderer).toHaveBeenCalledWith(mockContents[2], 2);
	});

	it("should show loading state while fetching", async () => {
		const fetchCallback = vi.fn(
			() =>
				new Promise<FetchResult<TestContent>>((resolve) =>
					setTimeout(
						() =>
							resolve({
								items: mockContents,
								hasMore: false,
							}),
						100,
					),
				),
		);

		render(
			<FastContent fetchCallback={fetchCallback} renderer={mockRenderer} />,
		);

		expect(screen.getByText("Loading...")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});
	});

	it("should load more contents on scroll", async () => {
		const page1 = [
			{ id: 1, title: "Content 1" },
			{ id: 2, title: "Content 2" },
		];
		const page2 = [
			{ id: 3, title: "Content 3" },
			{ id: 4, title: "Content 4" },
		];

		const fetchCallback = createMockFetch([page1, page2]);

		const { container } = render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={mockRenderer}
				scrollThreshold={0.8}
				batchSize={2}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		expect(fetchCallback).toHaveBeenCalledTimes(1);

		// Simulate scroll to trigger load more
		const scrollContainer = container.firstChild as HTMLElement;
		Object.defineProperty(scrollContainer, "scrollHeight", {
			value: 1000,
			writable: true,
		});
		Object.defineProperty(scrollContainer, "clientHeight", {
			value: 200,
			writable: true,
		});
		fireEvent.scroll(scrollContainer, { target: { scrollTop: 800 } });

		await waitFor(() => {
			expect(fetchCallback).toHaveBeenCalledWith({
				offset: 2,
				limit: 2,
			});
		});

		await waitFor(() => {
			expect(screen.getByText("Content 3")).toBeInTheDocument();
			expect(screen.getByText("Content 4")).toBeInTheDocument();
		});
	});

	it("should not load more when hasMore is false", async () => {
		const fetchCallback = createMockFetch([mockContents]);

		const { container } = render(
			<FastContent fetchCallback={fetchCallback} renderer={mockRenderer} />,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		expect(fetchCallback).toHaveBeenCalledTimes(1);

		// Simulate scroll
		const scrollContainer = container.firstChild as HTMLElement;
		Object.defineProperty(scrollContainer, "scrollHeight", {
			value: 1000,
			writable: true,
		});
		Object.defineProperty(scrollContainer, "clientHeight", {
			value: 200,
			writable: true,
		});
		fireEvent.scroll(scrollContainer, { target: { scrollTop: 800 } });

		// Wait a bit to ensure no additional fetch
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(fetchCallback).toHaveBeenCalledTimes(1);
	});

	it("should handle fetch errors gracefully", async () => {
		const fetchCallback = vi.fn(() =>
			Promise.reject(new Error("Fetch failed")),
		);

		render(
			<FastContent fetchCallback={fetchCallback} renderer={mockRenderer} />,
		);

		await waitFor(() => {
			expect(fetchCallback).toHaveBeenCalled();
		});

		// Component should still render without crashing
		expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
	});

	it("should use custom scroll threshold", async () => {
		const page1 = [{ id: 1, title: "Content 1" }];
		const page2 = [{ id: 2, title: "Content 2" }];

		const fetchCallback = createMockFetch([page1, page2]);

		const { container } = render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={mockRenderer}
				scrollThreshold={0.5}
				batchSize={1}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		// Simulate scroll at 50% threshold
		const scrollContainer = container.firstChild as HTMLElement;
		Object.defineProperty(scrollContainer, "scrollHeight", {
			value: 1000,
			writable: true,
		});
		Object.defineProperty(scrollContainer, "clientHeight", {
			value: 200,
			writable: true,
		});
		fireEvent.scroll(scrollContainer, { target: { scrollTop: 400 } });

		await waitFor(() => {
			expect(fetchCallback).toHaveBeenCalledWith({
				offset: 1,
				limit: 1,
			});
		});
	});

	it("should render custom fallback while initializing", async () => {
		const fetchCallback = vi.fn(
			() =>
				new Promise<FetchResult<TestContent>>((resolve) =>
					setTimeout(
						() =>
							resolve({
								items: mockContents,
								hasMore: false,
							}),
						100,
					),
				),
		);

		render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={mockRenderer}
				fallback={<div data-testid="custom-fallback">Please wait...</div>}
			/>,
		);

		// Custom fallback should appear immediately
		expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});
	});

	it("should render custom loadingMoreFallback when loading more items", async () => {
		const page1 = [{ id: 1, title: "Content 1" }];
		const page2 = [{ id: 2, title: "Content 2" }];

		const fetchCallback = createMockFetch([page1, page2]);

		const { container } = render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={mockRenderer}
				batchSize={1}
				loadingMoreFallback={
					<div data-testid="loading-more">Loading more...</div>
				}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		// Scroll to bottom to trigger load more
		const scrollContainer = container.firstChild as HTMLElement;
		Object.defineProperty(scrollContainer, "scrollHeight", {
			value: 1000,
			writable: true,
		});
		Object.defineProperty(scrollContainer, "clientHeight", {
			value: 200,
			writable: true,
		});

		fireEvent.scroll(scrollContainer, { target: { scrollTop: 800 } });

		// Custom "loading more" fallback should appear
		await waitFor(() => {
			expect(screen.getByTestId("loading-more")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByText("Content 2")).toBeInTheDocument();
		});
	});
});
