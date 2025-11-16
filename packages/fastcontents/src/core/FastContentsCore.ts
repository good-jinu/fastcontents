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
			initialBatchSize: config.initialBatchSize ?? 10,
			batchSize: config.batchSize ?? 10,
			scrollThreshold: config.scrollThreshold ?? 0.8,
			renderer: config.renderer,
			container: config.container,
		};

		this.state = {
			items: [],
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

	shouldLoadMore(
		scrollTop: number,
		scrollHeight: number,
		clientHeight: number,
	): boolean {
		if (this.state.isLoading || !this.state.hasMore) {
			return false;
		}

		const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
		return scrollPercentage >= this.config.scrollThreshold;
	}

	destroy(): void {
		this.listeners.clear();
	}
}
