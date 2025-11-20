import type { ContentState, FastContentsConfig } from "fastcontents";
import { FastContentsCore } from "fastcontents";
import { useEffect, useRef, useState } from "react";

export interface UseFastContentConfig<T>
	extends Omit<FastContentsConfig<T>, "renderer" | "container"> {
	fetchCallback: FastContentsConfig<T>["fetchCallback"];
}

export interface UseFastContentReturn<T> extends ContentState<T> {
	loadMore: () => Promise<void>;
}

export function useFastContent<T>(
	config: UseFastContentConfig<T>,
): UseFastContentReturn<T> {
	const coreRef = useRef<FastContentsCore<T> | null>(null);
	const [state, setState] = useState<ContentState<T>>({
		items: [],
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

		core.loadMore();

		return () => {
			unsubscribe();
			core.destroy();
		};
	}, [initialBatchSize, batchSize, scrollThreshold]);

	const loadMore = async () => {
		if (coreRef.current) {
			await coreRef.current.loadMore();
		}
	};

	return {
		...state,
		loadMore,
	};
}
