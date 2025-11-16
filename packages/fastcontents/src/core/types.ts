/**
 * Generic content item type - determined by consumer
 */
export type ContentItem<T> = T;

/**
 * Pagination parameters passed to fetch callback
 */
export interface PaginationParams {
	offset: number;
	limit: number;
	cursor?: string;
}

/**
 * Result from fetch callback
 */
export interface FetchResult<T> {
	items: T[];
	nextCursor?: string;
	hasMore: boolean;
}

/**
 * Fetch callback function signature
 */
export type FetchCallback<T> = (
	params: PaginationParams,
) => Promise<FetchResult<T>>;

/**
 * Pluggable renderer interface
 */
export interface Renderer<T> {
	/**
	 * Mount a content item to the DOM
	 */
	mount(item: T, container: HTMLElement, index: number): void;

	/**
	 * Unmount a content item and clean up resources
	 */
	unmount(container: HTMLElement, index: number): void;

	/**
	 * Optional: Update an existing mounted item
	 */
	update?(item: T, container: HTMLElement, index: number): void;
}

/**
 * Configuration options for ContentLoader
 */
export interface FastContentsConfig<T> {
	fetchCallback: FetchCallback<T>;
	initialBatchSize?: number;
	batchSize?: number;
	scrollThreshold?: number;
	renderer?: Renderer<T>;
	container?: HTMLElement;
}

/**
 * Current state of the content loader
 */
export interface ContentState<T> {
	items: T[];
	isLoading: boolean;
	isInitialized: boolean;
	error: Error | null;
	hasMore: boolean;
}

/**
 * State change listener callback
 */
export type StateListener<T> = (state: ContentState<T>) => void;
