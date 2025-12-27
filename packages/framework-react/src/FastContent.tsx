// FastContent.tsx
import type { FetchCallback } from "fastcontents";
import type { SwipeWrapperProps } from "./SwipeWrapper";
import { DefaultSwipeWrapper, SwipeItem } from "./SwipeWrapper";
import { useFastContent } from "./useFastContent";
import { type SwipeOrientation, useSwipe } from "./useSwipe";

export interface FastContentProps<T> {
	fetchCallback: FetchCallback<T>;
	/**
	 * Renderer now receives a single item.
	 * 'index' is the global index of that item.
	 */
	renderer: React.ComponentType<{ content: T; index: number }>;

	// UI for navigation (Optional - you can implement your own buttons)
	renderControls?: React.ComponentType<{
		hasPrev: boolean;
		hasNext: boolean;
		onPrev: () => void;
		onNext: () => void;
		isLoading: boolean;
	}>;

	initialBatchSize?: number;
	batchSize?: number;
	fallback?: React.ReactNode;

	// Swipe Configuration
	enableSwipe?: boolean;
	orientation?: SwipeOrientation;
	swipeThreshold?: number;
	SwipeWrapper?: React.ComponentType<SwipeWrapperProps>;
}

export function FastContent<T>({
	fetchCallback,
	renderer: Renderer,
	renderControls: RenderControls,
	initialBatchSize = 3, // Keep small for navigation
	batchSize = 3,
	fallback,
	enableSwipe = false,
	orientation = "horizontal",
	swipeThreshold = 50,
	SwipeWrapper = DefaultSwipeWrapper,
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
		prevItem,
		nextItem,
	} = useFastContent<T>({
		fetchCallback,
		initialBatchSize,
		batchSize,
	});

	const hasPrev = currentIndex > 0;
	// We have a next item if it exists in memory OR if the server has more
	const hasNext = currentIndex < items.length - 1 || hasMore;

	const {
		offset,
		isDragging,
		isSnapping,
		containerRef,
		handlers,
		style: swipeStyle,
	} = useSwipe({
		onSwipeNext: goNext,
		onSwipePrev: goPrev,
		orientation,
		threshold: swipeThreshold,
		currentIndex,
		canGoNext: hasNext,
		canGoPrev: hasPrev,
	});

	if (!isInitialized && isLoading) {
		return <>{fallback}</>;
	}

	if (!currentItem) {
		return <div>No content available</div>;
	}

	return (
		<div
			ref={enableSwipe ? containerRef : undefined}
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				overflow: "hidden", // Essential for swipe containment
				...(enableSwipe ? swipeStyle : {}),
			}}
			{...(enableSwipe ? handlers : {})}
		>
			{enableSwipe ? (
				<SwipeWrapper
					offset={offset}
					isDragging={isDragging}
					isSnapping={isSnapping}
					orientation={orientation}
				>
					{prevItem && (
						<SwipeItem position="prev" orientation={orientation}>
							<Renderer content={prevItem} index={currentIndex - 1} />
						</SwipeItem>
					)}
					<SwipeItem position="current" orientation={orientation}>
						<Renderer content={currentItem} index={currentIndex} />
					</SwipeItem>
					{nextItem && (
						<SwipeItem position="next" orientation={orientation}>
							<Renderer content={nextItem} index={currentIndex + 1} />
						</SwipeItem>
					)}
				</SwipeWrapper>
			) : (
				<Renderer content={currentItem} index={currentIndex} />
			)}

			{/* Optional: Render Navigation Controls */}
			{RenderControls && (
				<RenderControls
					hasPrev={hasPrev}
					hasNext={hasNext}
					onPrev={goPrev}
					onNext={goNext}
					isLoading={isLoading}
				/>
			)}
		</div>
	);
}
