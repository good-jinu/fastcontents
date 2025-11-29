// FastContent.tsx
import type { FetchCallback } from "fastcontents";
import { useFastContent } from "./useFastContent";

export interface FastContentProps<T> {
	fetchCallback: FetchCallback<T>;
	/**
	 * Renderer now receives a single item.
	 * 'index' is the global index of that item.
	 */
	renderer: React.ComponentType<{ content: T; index: number }>;

	// UI for navigation (Optional - you can implement your own buttons)
	renderControls?: (props: {
		hasPrev: boolean;
		hasNext: boolean;
		onPrev: () => void;
		onNext: () => void;
		isLoading: boolean;
	}) => React.ReactNode;

	initialBatchSize?: number;
	batchSize?: number;
	fallback?: React.ReactNode;
}

export function FastContent<T>({
	fetchCallback,
	renderer: Renderer,
	renderControls,
	initialBatchSize = 3, // Keep small for navigation
	batchSize = 3,
	fallback,
}: FastContentProps<T>) {
	const {
		currentItem,
		currentIndex,
		isLoading,
		isInitialized,
		items,
		hasMore,
		goNext,
		goPrev,
	} = useFastContent<T>({
		fetchCallback,
		initialBatchSize,
		batchSize,
	});

	const hasPrev = currentIndex > 0;
	// We have a next item if it exists in memory OR if the server has more
	const hasNext = currentIndex < items.length - 1 || hasMore;

	if (!isInitialized && isLoading) {
		return <>{fallback}</>;
	}

	if (!currentItem) {
		return <div>No content available</div>;
	}

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			{/* 1. Render ONLY the current item */}
			<Renderer content={currentItem} index={currentIndex} />

			{/* 2. Optional: Render Navigation Controls */}
			{renderControls?.({
				hasPrev,
				hasNext,
				onPrev: goPrev,
				onNext: goNext,
				isLoading,
			})}
		</div>
	);
}
