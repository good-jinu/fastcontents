# @fastcontents/react

React component for navigating through short-form content with efficient buffering and prefetching.

## Installation

```bash
npm install @fastcontents/react
```

## Features

- 🎯 **Navigation-based**: Display one content item at a time with prev/next controls
- 👆 **Swipe Gestures**: Built-in support for TikTok-style vertical or Instagram-style horizontal swiping
- 🚀 **Smart buffering**: Automatically prefetches content ahead of user navigation
- ⚡ **Efficient loading**: Loads content in small batches to minimize initial load time
- 🎨 **Fully customizable**: Bring your own UI for content and navigation controls
- 📱 **Mobile-friendly**: Optimized for touch interactions and mobile devices

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

## Swipe Support

Enable swipe gestures for a modern mobile experience.

### Vertical Swipe (TikTok style)

```tsx
<FastContent
  fetchCallback={fetchVideos}
  renderer={VideoPlayer}
  enableSwipe={true}
  orientation="vertical"
  initialBatchSize={3}
/>
```

### Horizontal Swipe (Stories style)

```tsx
<FastContent
  fetchCallback={fetchStories}
  renderer={StoryViewer}
  enableSwipe={true}
  orientation="horizontal"
/>
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

#### `renderer` (required)
```tsx
type Renderer<T> = React.ComponentType<{
  content: T;
  index: number;
}>;
```

Component to render each content item. Receives the current content and its global index.

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

Custom navigation controls. If not provided, you'll need to implement your own navigation UI or use swipe gestures.

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

#### `enableSwipe` (optional)
- Type: `boolean`
- Default: `false`

Enables touch swipe gestures for navigation.

#### `orientation` (optional)
- Type: `'horizontal' | 'vertical'`
- Default: `'horizontal'`

Direction of swipe gestures.

#### `swipeThreshold` (optional)
- Type: `number`
- Default: `50`

Distance in pixels the user must swipe to trigger navigation.

#### `SwipeWrapper` (optional)
- Type: `React.ComponentType<SwipeWrapperProps>`
- Default: `DefaultSwipeWrapper`

Custom component to wrap the swipeable items. Use this to customize animations or layout during swipe.

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
      enableSwipe={true}
      orientation="vertical"
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
    scrollThreshold: 200, // Optional: for infinite scroll logic
  });

  if (!currentItem) {
    return <div>Loading...</div>;
  }

  return (
    <div>
       {/* Custom UI Implementation */}
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

### Configuration Object

- `fetchCallback` (required): Function to fetch data.
- `initialBatchSize` (optional): Items to load initially.
- `batchSize` (optional): Items to load per batch.
- `scrollThreshold` (optional): Threshold for triggering loadMore in scroll-based implementations.

## Other Exports

The package also exports building blocks for custom swipe implementations:

- `useSwipe`: Hook for handling touch events and swipe logic.
- `SwipeItem`: Component for wrapping individual swipe items.
- `DefaultSwipeWrapper`: The default container for swipeable content.
- `SwipeOrientation`: Type definition for 'horizontal' | 'vertical'.

## Performance Tips

1. **Keep batch sizes small** (3-5 items) for faster initial load
2. **Use the `fallback` prop** to show loading UI during initial fetch
3. **Prefetch media** in your renderer when `nextItem` is available
4. **Memoize your renderer** component to avoid unnecessary re-renders
5. **Use `enableSwipe`** for mobile-first experiences

## Testing

Run tests:

```bash
pnpm test
```

## License

MIT
