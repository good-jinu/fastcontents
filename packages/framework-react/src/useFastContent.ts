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

	useEffect(() => {
		const core = new FastContentsCore<T>(config);
		coreRef.current = core;

		const unsubscribe = core.subscribe((newState) => {
			setState(newState);
		});

		queueMicrotask(() => {
			core.loadMore();
		});

		return () => {
			unsubscribe();
			core.destroy();
		};
	}, [config]);

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
