import type { FetchCallback } from "fastcontents";
import { useEffect, useRef } from "react";
import { useFastContent } from "./useFastContent";

export interface FastContentProps<T> {
	fetchCallback: FetchCallback<T>;
	renderer: (content: T, index: number) => React.ReactNode;
	initialBatchSize?: number;
	batchSize?: number;
	scrollThreshold?: number;
}

export function FastContent<T>({
	fetchCallback,
	renderer,
	initialBatchSize,
	batchSize,
	scrollThreshold = 0.8,
}: FastContentProps<T>) {
	const { items, isLoading, isInitialized, loadMore, hasMore } =
		useFastContent<T>({
			fetchCallback,
			initialBatchSize,
			batchSize,
			scrollThreshold,
		});

	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container;
			const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

			if (scrollPercentage >= scrollThreshold && !isLoading && hasMore) {
				loadMore();
			}
		};

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, [isLoading, hasMore, scrollThreshold, loadMore]);

	const showInitialLoading =
		!isInitialized || (isLoading && items.length === 0);

	return (
		<div ref={containerRef} style={{ height: "100%", overflow: "auto" }}>
			{showInitialLoading && <div>Loading...</div>}
			{items.map((content, index) => (
				<div key={index}>{renderer(content, index)}</div>
			))}
			{isLoading && items.length > 0 && <div>Loading...</div>}
		</div>
	);
}
