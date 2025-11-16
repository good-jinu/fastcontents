# Testing Guide

This monorepo uses Vitest for testing across all packages.

## Running Tests

### Run all tests in the monorepo
```bash
pnpm test
```

### Run tests in watch mode
```bash
pnpm test:watch
```

### Run tests with UI
```bash
pnpm test:ui
```

### Run tests for a specific package
```bash
# From root
pnpm --filter @fastcontents/react test
pnpm --filter fastcontents test

# Or from package directory
cd packages/framework-react
pnpm test
```

## Package-Specific Testing

### @fastcontents/react
- Uses jsdom environment for React component testing
- Includes @testing-library/react for component testing
- Setup file: `packages/framework-react/src/test/setup.ts`

### fastcontents
- Uses Node environment for core library testing
- Tests TypeScript types and core functionality

## Configuration

- **Root workspace config**: `vitest.workspace.ts` - Defines all packages in the workspace
- **Package configs**: Each package has its own `vitest.config.ts` for package-specific settings

## Writing Tests

Tests should be placed next to the source files with `.test.ts` or `.test.tsx` extension:

```
src/
  component.tsx
  component.test.tsx
  utils.ts
  utils.test.ts
```

## CI/CD

Add this to your CI pipeline:

```bash
pnpm install
pnpm test
```
