## FastContents

The `FastContentsCore<T>` class acts as a **state manager and controller** for fetching a list of items of type `T`. It encapsulates the logic for pagination, state management, and notifying subscribers when data changes.

### Key Responsibilities

1.  **State Management:** It holds the current state of the content, including:
      * `items`: The array of loaded data items (`T[]`).
      * `isLoading`: A boolean indicating if a fetch request is currently running.
      * `hasMore`: A boolean indicating if there are more items to fetch.
      * `error`: Any error that occurred during fetching.
2.  **Pagination Control:** It manages the necessary variables for progressive loading:
      * `offset`: Used for **offset-based pagination** (how many items to skip).
      * `currentCursor`: Used for **cursor-based pagination** (a token from the last fetch indicating where to start the next one).
3.  **Data Fetching:** The `loadMore()` method handles the asynchronous logic to fetch the next batch of data using a user-provided `fetchCallback`. It automatically determines whether to use the `initialBatchSize` or the standard `batchSize`.
4.  **Subscription Pattern:** The `subscribe()` method allows UI components or other parts of the application to listen for state changes (e.g., when new items are added, or `isLoading` changes) and re-render accordingly.
5.  **Scroll Detection Logic:** The `shouldLoadMore()` method provides the calculation to check if the user has scrolled close enough to the bottom of the list (based on `scrollThreshold`) to trigger the next data fetch.

-----

## 💡 Use Cases

This library is primarily used for optimizing the performance and user experience of long lists or feeds.

### 1\. Infinite Scrolling Feed (Social Media/News)

Load the first batch of posts when the component mounts, then automatically load the next batch of posts when the user scrolls near the bottom of the feed.

  * **Benefit:** Users don't have to click a "Load More" button, and initial load time is fast because only a small batch is loaded first.

### 2\. Large Data Table Paging

Instead of traditional page-by-page navigation, the table loads more rows as the user scrolls down through the visible portion of the data set.

  * **Benefit:** Provides a seamless viewing experience for large datasets without reloading the entire page or manually managing page numbers.

### 3\. Progressive Image Loading

In a photo gallery, only the visible photos are loaded initially, and more are loaded progressively as the user scrolls.

  * **Benefit:** Reduces bandwidth and speeds up the time-to-interactive for pages with many images.

-----

## 💻 Simple Code Example

Let's assume the following types are defined in your project (as imported in the original code):

```typescript
// types.ts (Mocked)
export interface Item {
    id: number;
    text: string;
}

export interface PaginationParams {
    offset: number;
    limit: number;
    cursor?: string;
}

export interface FetchResult<T> {
    items: T[];
    hasMore: boolean;
    nextCursor?: string;
}

// ... other types like ContentState and FastContentsConfig
```

### 1\. Define the Data Fetcher

This is the function you provide to the core, simulating an API call.

```typescript
// Simulate an API that uses offset/limit pagination
async function mockFetchItems(params: PaginationParams): Promise<FetchResult<Item>> {
    console.log(`Fetching items: offset=${params.offset}, limit=${params.limit}`);

    // Mock data source
    const allData: Item[] = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        text: `Content Item #${i + 1}`,
    }));

    const items = allData.slice(params.offset, params.offset + params.limit);
    const hasMore = params.offset + params.limit < allData.length;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500)); 

    return {
        items,
        hasMore,
        // Using offset-based for simplicity, so no nextCursor needed here.
    };
}
```

### 2\. Initialize and Use the Core

We'll use a simple listener to log state changes. In a real application, this listener would trigger a UI re-render.

```typescript
import { FastContentsCore } from "./FastContentsCore"; // Assume the class is in this file

const fastContent = new FastContentsCore<Item>({
    fetchCallback: mockFetchItems,
    initialBatchSize: 5, // Load 5 items initially
    batchSize: 3,        // Load 3 items on subsequent loads
    scrollThreshold: 0.9,
});

// Subscribe to state changes (to simulate UI updates)
const unsubscribe = fastContent.subscribe((state) => {
    console.log('--- State Update ---');
    console.log(`Loaded Items: ${state.items.length}`);
    console.log(`Is Loading: ${state.isLoading}`);
    console.log(`Has More: ${state.hasMore}`);
    // In a UI framework, you would use this state to update the rendered list.
});

// --- Initial Load ---
console.log('Starting initial load...');
await fastContent.loadMore();

// --- Subsequent Load (Simulating Scroll) ---
console.log('\nSimulating user scrolling to the bottom...');
await fastContent.loadMore();

// Check if we *should* load more (simulating a scroll event check)
const shouldLoad = fastContent.shouldLoadMore(
    1800, // scrollTop (simulated)
    2000, // scrollHeight (simulated total height)
    500   // clientHeight (simulated visible area)
);

console.log(`\nShould load more based on scroll? ${shouldLoad}`);
if (shouldLoad) {
    await fastContent.loadMore();
}

// Cleanup
unsubscribe();
fastContent.destroy();
```

Would you like me to focus on explaining a specific method like `loadMore()` or `shouldLoadMore()` in more detail?