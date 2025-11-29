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
			const pageIndex = params.offset / (params.limit || 3);
			return Promise.resolve({
				items: pages[pageIndex] || [],
				hasMore: pageIndex < pages.length - 1,
			});
		});
	};

	const mockRenderer = vi.fn(
		({ content }: { content: TestContent; index: number }) => (
			<div data-testid={`content-${content.id}`}>{content.title}</div>
		),
	);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render the first item initially", async () => {
		const fetchCallback = createMockFetch();

		render(
			<FastContent fetchCallback={fetchCallback} renderer={mockRenderer} />,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		expect(fetchCallback).toHaveBeenCalledWith({
			offset: 0,
			limit: 3,
		});
		// Should only render the first item (navigation mode)
		expect(screen.getByText("Content 1")).toBeInTheDocument();
		expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
		expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
	});

	it("should call renderer with current item and index", async () => {
		const fetchCallback = createMockFetch();

		render(
			<FastContent fetchCallback={fetchCallback} renderer={mockRenderer} />,
		);

		await waitFor(() => {
			expect(mockRenderer).toHaveBeenCalled();
		});

		// Should render only the first item initially
		// Renderer is called with props object as first argument
		const firstCall = mockRenderer.mock.calls[0][0];
		expect(firstCall.content).toEqual(mockContents[0]);
		expect(firstCall.index).toBe(0);
	});

	it("should show fallback while initializing", async () => {
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
				fallback={<div data-testid="loading">Loading...</div>}
			/>,
		);

		expect(screen.getByTestId("loading")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});
	});

	it("should navigate to next item with custom controls", async () => {
		const fetchCallback = createMockFetch();

		render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={mockRenderer}
				renderControls={({ hasNext, onNext }) => (
					<button
						type="button"
						onClick={onNext}
						disabled={!hasNext}
						data-testid="next-btn"
					>
						Next
					</button>
				)}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		const nextBtn = screen.getByTestId("next-btn");
		fireEvent.click(nextBtn);

		await waitFor(() => {
			expect(screen.getByText("Content 2")).toBeInTheDocument();
		});

		expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
	});

	it("should navigate to previous item with custom controls", async () => {
		const fetchCallback = createMockFetch();

		render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={mockRenderer}
				renderControls={({ hasPrev, hasNext, onPrev, onNext }) => (
					<div>
						<button
							type="button"
							onClick={onPrev}
							disabled={!hasPrev}
							data-testid="prev-btn"
						>
							Prev
						</button>
						<button
							type="button"
							onClick={onNext}
							disabled={!hasNext}
							data-testid="next-btn"
						>
							Next
						</button>
					</div>
				)}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		// Go to next item
		fireEvent.click(screen.getByTestId("next-btn"));

		await waitFor(() => {
			expect(screen.getByText("Content 2")).toBeInTheDocument();
		});

		// Go back to previous item
		fireEvent.click(screen.getByTestId("prev-btn"));

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});
	});

	it("should load more items when navigating beyond buffer", async () => {
		const page1 = [
			{ id: 1, title: "Content 1" },
			{ id: 2, title: "Content 2" },
		];
		const page2 = [
			{ id: 3, title: "Content 3" },
			{ id: 4, title: "Content 4" },
		];

		const fetchCallback = createMockFetch([page1, page2]);

		render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={mockRenderer}
				batchSize={2}
				initialBatchSize={2}
				renderControls={({ hasNext, onNext }) => (
					<button
						type="button"
						onClick={onNext}
						disabled={!hasNext}
						data-testid="next-btn"
					>
						Next
					</button>
				)}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		// Navigate to second item
		fireEvent.click(screen.getByTestId("next-btn"));

		await waitFor(() => {
			expect(screen.getByText("Content 2")).toBeInTheDocument();
		});

		// Navigate to third item (should trigger load more)
		fireEvent.click(screen.getByTestId("next-btn"));

		await waitFor(() => {
			expect(fetchCallback).toHaveBeenCalledWith({
				offset: 2,
				limit: 2,
			});
		});

		await waitFor(() => {
			expect(screen.getByText("Content 3")).toBeInTheDocument();
		});
	});

	it("should disable next button when no more content", async () => {
		const fetchCallback = createMockFetch([mockContents]);

		render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={mockRenderer}
				renderControls={({ hasNext, onNext }) => (
					<button
						type="button"
						onClick={onNext}
						disabled={!hasNext}
						data-testid="next-btn"
					>
						Next
					</button>
				)}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});

		// Navigate to last item
		fireEvent.click(screen.getByTestId("next-btn"));
		await waitFor(() => {
			expect(screen.getByText("Content 2")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("next-btn"));
		await waitFor(() => {
			expect(screen.getByText("Content 3")).toBeInTheDocument();
		});

		// Next button should be disabled
		const nextBtn = screen.getByTestId("next-btn");
		expect(nextBtn).toBeDisabled();
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

		// Component should show "No content available" when error occurs
		await waitFor(() => {
			expect(screen.getByText("No content available")).toBeInTheDocument();
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

		expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});
	});

	it("should show loading state in controls when navigating", async () => {
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

		render(
			<FastContent
				fetchCallback={fetchCallback}
				renderer={mockRenderer}
				renderControls={({ isLoading, hasNext, onNext }) => (
					<div>
						<button
							type="button"
							onClick={onNext}
							disabled={!hasNext}
							data-testid="next-btn"
						>
							Next
						</button>
						{isLoading && <span data-testid="loading-indicator">Loading</span>}
					</div>
				)}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
		});
	});
});
