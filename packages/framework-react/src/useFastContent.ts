import type { ContentState, FastContentsConfig } from "fastcontents";
import { FastContentsCore } from "fastcontents";
import { useEffect, useRef, useState } from "react";

export interface UseFastContentConfig<T>
	extends Omit<FastContentsConfig<T>, "renderer" | "container"> {
	fetchCallback: FastContentsConfig<T>["fetchCallback"];
}

export interface UseFastContentReturn<T> extends ContentState<T> {
	loadMore: () => Promise<void>;
	goNext: () => Promise<void>;
	goPrev: () => void;
	currentItem: T | undefined;
	nextItem: T | undefined;
	prevItem: T | undefined;
}

export function useFastContent<T>(
	config: UseFastContentConfig<T>,
): UseFastContentReturn<T> {
	const coreRef = useRef<FastContentsCore<T> | null>(null);
	const [state, setState] = useState<ContentState<T>>({
		items: [],
		currentIndex: 0,
		isLoading: false,
		isInitialized: false,
		error: null,
		hasMore: true,
	});

	const { fetchCallback, initialBatchSize, batchSize, scrollThreshold } =
		config;
	const savedFetchCallback = useRef(fetchCallback);

	useEffect(() => {
		savedFetchCallback.current = fetchCallback;
	}, [fetchCallback]);

	useEffect(() => {
		const core = new FastContentsCore<T>({
			fetchCallback: (params) => savedFetchCallback.current(params),
			initialBatchSize,
			batchSize,
			scrollThreshold,
		});
		coreRef.current = core;

		const unsubscribe = core.subscribe((newState) => {
			setState(newState);
		});

		// Initial load to fill the buffer
		core.loadMore();

		return () => {
			unsubscribe();
			core.destroy();
		};
	}, [initialBatchSize, batchSize, scrollThreshold]);

	const loadMore = async () => {
		if (coreRef.current) await coreRef.current.loadMore();
	};

	const goNext = async () => {
		if (coreRef.current) await coreRef.current.goNext();
	};

	const goPrev = () => {
		if (coreRef.current) coreRef.current.goPrev();
	};

	// Helper properties for the view
	const currentItem = state.items[state.currentIndex];
	const prevItem = state.items[state.currentIndex - 1];
	const nextItem = state.items[state.currentIndex + 1];

	return {
		...state,
		loadMore,
		goNext,
		goPrev,
		currentItem,
		prevItem,
		nextItem,
	};
}
