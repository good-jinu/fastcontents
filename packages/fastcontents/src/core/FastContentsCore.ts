// FastContentsCore.ts
import type {
	ContentState,
	FastContentsConfig,
	PaginationParams,
} from "./types";

export class FastContentsCore<T> {
	private state: ContentState<T>;
	private config: Required<
		Omit<FastContentsConfig<T>, "renderer" | "container">
	> & {
		renderer?: FastContentsConfig<T>["renderer"];
		container?: FastContentsConfig<T>["container"];
	};
	private listeners: Set<(state: ContentState<T>) => void>;
	private currentCursor?: string;
	private offset: number;

	constructor(config: FastContentsConfig<T>) {
		this.config = {
			fetchCallback: config.fetchCallback,
			initialBatchSize: config.initialBatchSize ?? 3, // Default low for windowing
			batchSize: config.batchSize ?? 3, // Fetch small chunks
			scrollThreshold: config.scrollThreshold ?? 0.8,
			renderer: config.renderer,
			container: config.container,
		};

		this.state = {
			items: [],
			currentIndex: 0, // Start at the beginning
			isLoading: false,
			isInitialized: false,
			error: null,
			hasMore: true,
		};

		this.listeners = new Set();
		this.offset = 0;
	}

	getState(): ContentState<T> {
		return { ...this.state };
	}

	subscribe(listener: (state: ContentState<T>) => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private notifyListeners(): void {
		for (const listener of this.listeners) {
			listener(this.getState());
		}
	}

	private updateState(partial: Partial<ContentState<T>>): void {
		this.state = { ...this.state, ...partial };
		this.notifyListeners();
	}

	/**
	 * Standard fetch logic, but designed to be called eagerly
	 * to populate the buffer ahead of the current index.
	 */
	async loadMore(): Promise<void> {
		if (this.state.isLoading || !this.state.hasMore) {
			return;
		}

		this.updateState({ isLoading: true, error: null });

		try {
			const limit = this.state.isInitialized
				? this.config.batchSize
				: this.config.initialBatchSize;

			const params: PaginationParams = {
				offset: this.offset,
				limit,
			};

			if (this.currentCursor) {
				params.cursor = this.currentCursor;
			}

			const result = await this.config.fetchCallback(params);

			this.offset += result.items.length;

			if (result.nextCursor) {
				this.currentCursor = result.nextCursor;
			}

			this.updateState({
				items: [...this.state.items, ...result.items],
				hasMore: result.hasMore,
				isLoading: false,
				isInitialized: true,
			});
		} catch (error) {
			this.updateState({
				error: error instanceof Error ? error : new Error(String(error)),
				isLoading: false,
			});
		}
	}

	// --- Navigation Logic ---

	/**
	 * Advance to the next item.
	 * Triggers a fetch if we are nearing the end of our buffer.
	 */
	async goNext(): Promise<void> {
		const { currentIndex, items, hasMore, isLoading } = this.state;

		// 1. If we are already at the end of known items and there is no more data, stop.
		if (currentIndex >= items.length - 1 && !hasMore) {
			return;
		}

		// 2. Advance the cursor
		const nextIndex = currentIndex + 1;

		// Prevent going out of bounds if currently loading
		if (nextIndex > items.length - 1 && isLoading) {
			return;
		}

		this.updateState({ currentIndex: nextIndex });

		// 3. "Get Ready": Check if we need to buffer more.
		// If we have fewer than 2 items ahead of us, trigger a load.
		const itemsRemaining = items.length - (nextIndex + 1);
		if (itemsRemaining < 2 && hasMore && !isLoading) {
			await this.loadMore();
		}
	}

	/**
	 * Go to previous item.
	 * No fetching needed usually, as previous items are cached in memory.
	 */
	goPrev(): void {
		if (this.state.currentIndex > 0) {
			this.updateState({ currentIndex: this.state.currentIndex - 1 });
		}
	}

	destroy(): void {
		this.listeners.clear();
	}
}
