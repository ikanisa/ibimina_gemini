# Ibimina Architecture Overview

Last updated: January 2026

## Overview

Ibimina is a PWA (Progressive Web App) for managing group savings, loans, and transactions for SACCOs and MFIs in Rwanda.

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | TailwindCSS, Framer Motion |
| **State Management** | React Query (TanStack Query) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Hosting** | Cloudflare Pages |
| **Error Tracking** | Sentry |

## Directory Structure

```
src/
├── core/                    # Core infrastructure
│   ├── config/              # Environment, Supabase client
│   ├── types/               # Database and domain types
│   ├── errors/              # Error classes and handling
│   ├── auth/                # Authentication exports
│   └── query/               # React Query utilities
│
├── features/                # Feature modules (vertical slices)
│   ├── dashboard/           # Dashboard feature
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── transactions/        # Transaction management
│   ├── directory/           # Members & Groups
│   │   ├── groups/
│   │   └── members/
│   ├── reports/             # Reporting
│   ├── settings/            # App settings
│   └── auth/                # Authentication UI
│
├── shared/                  # Reusable components
│   ├── components/
│   │   ├── ui/              # Primitives (Button, Input, etc.)
│   │   ├── layout/          # App layout components
│   │   └── errors/          # Error boundaries
│   └── hooks/               # Generic hooks
│
├── lib/                     # Utilities (legacy location)
│   ├── api/                 # API clients
│   └── errors/              # Error handler
│
└── App.tsx                  # Main app entry
```

## Architecture Patterns

### 1. Feature-Based Organization

Each feature is a vertical slice with:

- **Components**: React components for UI
- **Hooks**: React Query hooks for data fetching
- **Services**: Data access layer with Supabase calls

```typescript
// Import from feature module
import { useTransactionsV2, transactionService } from '@/features/transactions';
```

### 2. Service Layer Pattern

Services encapsulate all data access:

```typescript
// Service handles all Supabase calls
const transactionService = {
  getAll: (filters) => { /* Supabase query */ },
  getById: (id) => { /* Supabase query */ },
  create: (data) => { /* Supabase insert */ },
};
```

Benefits:
- Single source of truth for data access
- Easy to replace backend (e.g., switch from Supabase to REST API)
- Consistent error handling

### 3. Typed Error Hierarchy

All errors extend `AppError`:

```typescript
import { ValidationError, NotFoundError } from '@/core/errors';

try {
  await transactionService.getById('xxx');
} catch (error) {
  if (error instanceof NotFoundError) {
    // Handle 404
  }
}
```

### 4. React Query Standardization

Hooks use standardized utilities:

```typescript
import { useServiceQuery, CACHE_TIMES } from '@/core/query';

function useTransactionsV2() {
  return useServiceQuery(
    transactionKeys.list(filters),
    () => transactionService.getAll(filters),
    { cacheTime: 'MEDIUM' }
  );
}
```

## Data Flow

```
Component --> Hook (useQuery) --> Service --> Supabase
    ^              |
    |              v
    +-------- Query Cache
```

## Authentication Flow

1. User enters credentials
2. `AuthContext` calls Supabase Auth
3. JWT stored in localStorage
4. `institutionId` extracted from user metadata
5. All queries scoped to `institutionId`
6. RLS policies enforce tenant isolation

## Key Conventions

### Import Paths

```typescript
// Core module
import { supabase, env, AppError } from '@/core';

// Feature modules
import { useTransactionsV2 } from '@/features/transactions';
import { useMembersV2 } from '@/features/directory';

// Shared components
import { Button, LoadingSpinner } from '@/shared/components/ui';
```

### Query Keys

```typescript
// Use the feature's key factory
import { transactionKeys } from '@/features/transactions';

// Consistent structure
transactionKeys.all;           // ['transactions']
transactionKeys.lists();       // ['transactions', 'list']
transactionKeys.list(filters); // ['transactions', 'list', {...}]
transactionKeys.detail(id);    // ['transactions', 'detail', 'xxx']
```

### Error Handling

```typescript
// In services - throw typed errors
if (!result) {
  throw new NotFoundError('Transaction', id);
}

// In components - use error message helper
if (error) {
  return <ErrorDisplay message={getUserFriendlyMessage(error)} />;
}
```

## Performance Considerations

1. **Lazy Loading**: Heavy components loaded via `React.lazy()`
2. **Bundle Splitting**: Vendor chunks for large dependencies
3. **Query Caching**: React Query with appropriate stale times
4. **Optimistic Updates**: For mutations with rollback on error
5. **Virtualization**: `VirtualizedList` for large datasets

## Security Model

- **Authentication**: Supabase Auth with JWT
- **Multi-tenancy**: All data scoped by `institution_id`
- **RLS**: PostgreSQL Row Level Security enforced at database
- **Role-Based**: STAFF vs ADMIN roles for feature access
