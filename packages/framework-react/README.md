# @fastcontents/react

React component for displaying infinite short-form content.

## Installation

```bash
pnpm install @fastcontents/react
```

## Usage

```tsx
import { FastContent } from '@fastcontents/react';

function App() {
  return (
    <FastContent
      fetchContents={(page) => fetch(`/contents?page=${page}`).then(r => r.json())}
      renderer={(content) => <ContentItem data={content} />}
    />
  );
}
```

## API

### Props

- `fetchContents`: `(page: number) => Promise<{ items: T[], hasMore: boolean }>` - Function to fetch content for a given page
- `renderer`: `(content: T, index: number) => React.ReactNode` - Function to render each content item
- `initialPage`: `number` (optional, default: 0) - Starting page number
- `scrollThreshold`: `number` (optional, default: 0.8) - Scroll percentage threshold to trigger loading more content

## Testing

Run tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```
