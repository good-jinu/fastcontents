# @fastcontents/react

React component for navigating through short-form content with efficient buffering and prefetching.

## Installation

```bash
npm install @fastcontents/react
```

## Features

- 🎯 **Navigation-based**: Display one content item at a time with prev/next controls
- 🚀 **Smart buffering**: Automatically prefetches content ahead of user navigation
- ⚡ **Efficient loading**: Loads content in small batches to minimize initial load time
- 🎨 **Fully customizable**: Bring your own UI for content and navigation controls
- 📱 **Mobile-friendly**: Perfect for TikTok-style or Instagram Reels-style experiences

## Basic Usage

```tsx
import { FastContent } from '@fastcontents/react';

interface Post {
  id: number;
  title: string;
  content: string;
}

function App() {
  const fetchCallback = async ({ offset, limit }) => {
    const response = await fetch(`/api/posts?offset=${offset}&limit=${limit}`);
    const data = await response.json();
    
    return {
      items: data.posts,
      hasMore: data.hasMore,
    };
  };

  return (
    <FastContent
      fetchCallback={fetchCallback}
      renderer={({ content, index }) => (
        <div>
          <h2>{content.title}</h2>
          <p>{content.content}</p>
        </div>
      )}
      renderControls={({ hasPrev, hasNext, onPrev, onNext, isLoading }) => (
        <div>
          <button onClick={onPrev} disabled={!hasPrev || isLoading}>
            Previous
          </button>
          <button onClick={onNext} disabled={!hasNext || isLoading}>
            Next
          </button>
        </div>
      )}
    />
  );
}
```

## API Reference

### FastContent Props

#### `fetchCallback` (required)
```tsx
type FetchCallback<T> = (params: { offset: number; limit: number }) => Promise<{
  items: T[];
  hasMore: boolean;
}>;
```

Function to fetch content. Receives pagination parameters and returns items with a flag indicating if more content is available.

**Example:**
```tsx
const fetchCallback = async ({ offset, limit }) => {
  const response = await fetch(`/api/posts?offset=${offset}&limit=${limit}`);
  const { posts, total } = await response.json();
  
  return {
    items: posts,
    hasMore: offset + posts.length < total,
  };
};
```

#### `renderer` (required)
```tsx
type Renderer<T> = React.ComponentType<{
  content: T;
  index: number;
}>;
```

Component to render each content item. Receives the current content and its global index.

**Example:**
```tsx
const PostRenderer = ({ content, index }) => (
  <article>
    <h1>{content.title}</h1>
    <p>{content.body}</p>
    <small>Item #{index + 1}</small>
  </article>
);
```

#### `renderControls` (optional)
```tsx
type RenderControls = (props: {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  isLoading: boolean;
}) => React.ReactNode;
```

Custom navigation controls. If not provided, you'll need to implement your own navigation UI.

**Example:**
```tsx
const controls = ({ hasPrev, hasNext, onPrev, onNext, isLoading }) => (
  <nav>
    <button onClick={onPrev} disabled={!hasPrev || isLoading}>
      ← Prev
    </button>
    <span>{isLoading ? 'Loading...' : 'Navigate'}</span>
    <button onClick={onNext} disabled={!hasNext || isLoading}>
      Next →
    </button>
  </nav>
);
```

#### `initialBatchSize` (optional)
- Type: `number`
- Default: `3`

Number of items to fetch on initial load. Keep this small for faster initial rendering.

#### `batchSize` (optional)
- Type: `number`
- Default: `3`

Number of items to fetch when loading more content.

#### `fallback` (optional)
- Type: `React.ReactNode`
- Default: `undefined`

UI to show while the initial content is loading.

**Example:**
```tsx
<FastContent
  fetchCallback={fetchCallback}
  renderer={PostRenderer}
  fallback={<div>Loading your content...</div>}
/>
```

## Advanced Usage

### Full-Screen Content with Keyboard Navigation

```tsx
import { FastContent } from '@fastcontents/react';
import { useEffect } from 'react';

function VideoFeed() {
  const fetchVideos = async ({ offset, limit }) => {
    const res = await fetch(`/api/videos?offset=${offset}&limit=${limit}`);
    return res.json();
  };

  const VideoPlayer = ({ content, index }) => (
    <div style={{ height: '100vh', width: '100vw' }}>
      <video src={content.url} controls autoPlay />
      <h2>{content.title}</h2>
    </div>
  );

  const NavigationControls = ({ hasPrev, hasNext, onPrev, onNext, isLoading }) => {
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp' && hasPrev) onPrev();
        if (e.key === 'ArrowDown' && hasNext) onNext();
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasPrev, hasNext, onPrev, onNext]);

    return (
      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
        <button onClick={onPrev} disabled={!hasPrev}>↑</button>
        <button onClick={onNext} disabled={!hasNext}>↓</button>
      </div>
    );
  };

  return (
    <FastContent
      fetchCallback={fetchVideos}
      renderer={VideoPlayer}
      renderControls={NavigationControls}
      initialBatchSize={5}
      batchSize={5}
    />
  );
}
```

### Using the Hook Directly

For more control, use the `useFastContent` hook:

```tsx
import { useFastContent } from '@fastcontents/react';

function CustomContentViewer() {
  const {
    currentItem,
    currentIndex,
    isLoading,
    hasMore,
    items,
    goNext,
    goPrev,
  } = useFastContent({
    fetchCallback: async ({ offset, limit }) => {
      const res = await fetch(`/api/content?offset=${offset}&limit=${limit}`);
      return res.json();
    },
    initialBatchSize: 3,
    batchSize: 3,
  });

  if (!currentItem) {
    return <div>Loading...</div>;
  }

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1 || hasMore;

  return (
    <div>
      <article>
        <h1>{currentItem.title}</h1>
        <p>{currentItem.content}</p>
      </article>
      
      <nav>
        <button onClick={goPrev} disabled={!hasPrev}>
          Previous
        </button>
        <span>
          {currentIndex + 1} of {hasMore ? `${items.length}+` : items.length}
        </span>
        <button onClick={goNext} disabled={!hasNext}>
          Next
        </button>
      </nav>
    </div>
  );
}
```

## Hook API

### `useFastContent<T>(config)`

Returns an object with:

- `currentItem: T | undefined` - The currently displayed item
- `currentIndex: number` - Index of the current item
- `items: T[]` - All loaded items
- `isLoading: boolean` - Whether content is currently being fetched
- `isInitialized: boolean` - Whether initial load is complete
- `hasMore: boolean` - Whether more content is available from the server
- `error: Error | null` - Any error that occurred during fetching
- `goNext: () => Promise<void>` - Navigate to the next item
- `goPrev: () => void` - Navigate to the previous item
- `loadMore: () => Promise<void>` - Manually trigger loading more content
- `nextItem: T | undefined` - The next item (for prefetching)
- `prevItem: T | undefined` - The previous item

## Performance Tips

1. **Keep batch sizes small** (3-5 items) for faster initial load
2. **Use the `fallback` prop** to show loading UI during initial fetch
3. **Implement keyboard navigation** for better UX on desktop
4. **Prefetch media** in your renderer when `nextItem` is available
5. **Memoize your renderer** component to avoid unnecessary re-renders

## Testing

Run tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

## License

MIT
