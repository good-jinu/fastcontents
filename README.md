# FastContents

FastContents is a high-performance, framework-agnostic library for building infinite scrolling or swipeable content feeds (short-form video, image galleries, etc.). It comes with a dedicated React adapter for seamless integration into React applications.

## Packages

This monorepo contains the following packages:

- **[`fastcontents`](./packages/fastcontents)**: The core logic library. It handles state management, fetching, caching, and navigation logic. It is zero-dependency and framework-agnostic.
- **[`@fastcontents/react`](./packages/framework-react)**: The React binding for FastContents. It provides hooks (`useFastContent`) and components (`FastContent`) to easily build swipeable feeds.

## Installation

You can install the packages via your preferred package manager.

### React

```bash
npm install @fastcontents/react fastcontents
# or
pnpm add @fastcontents/react fastcontents
# or
yarn add @fastcontents/react fastcontents
```

## Usage

### React Example

Here is a simple example of how to use the `FastContent` component in a React application.

```tsx
import React from 'react';
import { FastContent } from '@fastcontents/react';

// 1. Define your content type
interface MyItem {
  id: string;
  url: string;
  title: string;
}

// 2. Create a renderer component for individual items
const ItemRenderer = ({ content, index }: { content: MyItem; index: number }) => (
  <div style={{ height: '100%', background: '#333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
    <img src={content.url} alt={content.title} style={{ maxWidth: '100%', maxHeight: '80%' }} />
    <h3>{content.title}</h3>
    <p>Index: {index}</p>
  </div>
);

// 3. Define a fetch callback
const fetchItems = async ({ offset, limit, cursor }) => {
  // Simulate an API call
  const newItems = Array.from({ length: limit }).map((_, i) => ({
    id: `item-${offset + i}`,
    url: `https://via.placeholder.com/300?text=Item+${offset + i}`,
    title: `Item ${offset + i}`,
  }));

  return {
    items: newItems,
    hasMore: true, // or false if end of list
    nextCursor: 'next-cursor-token', // optional
  };
};

export default function App() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <FastContent
        fetchCallback={fetchItems}
        renderer={ItemRenderer}
        initialBatchSize={3}
        batchSize={5}
        enableSwipe={true}
        orientation="vertical" // or "horizontal"
      />
    </div>
  );
}
```

### Core Logic (Vanilla JS/TS)

If you are not using React, you can use the core library directly.

```ts
import { FastContentsCore } from 'fastcontents';

const core = new FastContentsCore({
  fetchCallback: async ({ offset, limit }) => {
    // Fetch data...
    return { items: [...], hasMore: true };
  },
  initialBatchSize: 3,
  batchSize: 3,
});

// Subscribe to state changes
core.subscribe((state) => {
  console.log('Current Index:', state.currentIndex);
  console.log('Items:', state.items);
});

// Navigate
await core.loadMore(); // Initial load
await core.goNext();
core.goPrev();
```

## Features

- **Framework Agnostic Core:** Logic is separated from UI.
- **Infinite Loading:** Automatically buffers content as you navigate.
- **Swipe Support:** Built-in touch/swipe gestures for mobile-like navigation (React adapter).
- **Customizable:** Control batch sizes, swipe thresholds, and rendering.
- **Performance:** Optimized for minimal re-renders and efficient memory usage (windowing/buffering logic).

## Development

This project is a monorepo managed with `pnpm`.

### Prerequisities

- Node.js (>=20)
- pnpm (>=9)

### Setup

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test
```
