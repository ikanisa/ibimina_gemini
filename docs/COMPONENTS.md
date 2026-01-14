# Component API Reference

Core UI components for Ibimina SACCO+ Admin Portal.

---

## Design System

### Design Tokens

Location: `src/lib/design-tokens.ts`

| Token | Purpose |
|-------|---------|
| `colors` | Semantic color palette (primary, success, warning, danger, neutral) |
| `spacing` | Consistent spacing scale (xs–2xl: 8px–48px) |
| `typography` | Font family, sizes, weights, line heights |
| `shadows` | Elevation shadows (xs–2xl) |
| `transitions` | Duration presets (fast, normal, slow) |
| `breakpoints` | Responsive breakpoints (sm–2xl) |
| `zIndex` | Layering z-index values |

**Usage:**
```tsx
import { colors, spacing, shadows } from '@/lib/design-tokens';
```

---

## Core Components

### Button

Location: `src/components/ui/Button.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Shows spinner, disables button |
| `disabled` | `boolean` | `false` | Disables interaction |
| `leftIcon` | `ReactNode` | - | Icon before text |
| `rightIcon` | `ReactNode` | - | Icon after text |

---

### Card

Location: `src/components/ui/Card.tsx`

Memoized component (`React.memo`) for performance.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Card header title |
| `subtitle` | `string` | - | Secondary text |
| `actions` | `ReactNode` | - | Header action buttons |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Content padding |
| `glass` | `boolean` | `false` | Glass morphism effect |

---

### Input

Location: `src/components/ui/Input.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `error` | `string` | - | Error message |
| `hint` | `string` | - | Helper text |
| `leftIcon` | `ReactNode` | - | Leading icon |
| `rightIcon` | `ReactNode` | - | Trailing icon |

---

### Modal

Location: `src/components/ui/Modal.tsx`

Uses Radix UI Dialog primitive.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | - | Open state callback |
| `title` | `string` | - | Modal title |
| `description` | `string` | - | Accessible description |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal width |

---

### Toast

Location: `src/components/ui/Toast.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `'success' \| 'error' \| 'warning' \| 'info'` | Visual type |
| `title` | `string` | Toast heading |
| `description` | `string` | Extended message |
| `duration` | `number` | Auto-dismiss time (ms) |

**Usage via hook:**
```tsx
import { useToast } from '@/hooks/useToast';

const { toast } = useToast();
toast({ variant: 'success', title: 'Saved!' });
```

---

## Data Display

### Skeleton

Location: `src/components/ui/Skeleton.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'text' \| 'circular' \| 'rectangular' \| 'rounded'` | `'text'` | Shape |
| `width` | `string \| number` | - | Element width |
| `height` | `string \| number` | - | Element height |
| `animation` | `'pulse' \| 'shimmer'` | `'pulse'` | Loading animation |

**Page Skeletons:**
- `DashboardSkeleton`
- `TransactionsSkeleton`
- `MembersSkeleton`
- `GroupsSkeleton`
- `ReportsSkeleton`

---

### VirtualizedTransactionTable

Location: `src/components/Transactions/VirtualizedTransactionTable.tsx`

Virtualized table for large datasets using `@tanstack/react-virtual`.

| Prop | Type | Description |
|------|------|-------------|
| `transactions` | `Transaction[]` | Data array |
| `onRowClick` | `(tx: Transaction) => void` | Row click handler |
| `estimateSize` | `number` | Row height estimate |

---

## Animation

### AnimatedPage

Location: `src/components/common/AnimatedPage.tsx`

Wraps page content with Framer Motion page transitions.

```tsx
<AnimatedPage>
  <YourPageContent />
</AnimatedPage>
```

### AnimatedCard

Location: `src/components/common/AnimatedCard.tsx`

Card with entrance animation and hover effects.

### AnimatedList

Location: `src/components/common/AnimatedList.tsx`

Staggered list item animations.

---

## Performance Optimized Components

Components using `React.memo` for render optimization:

| Component | Location |
|-----------|----------|
| `MembersList` | `components/members/MembersList.tsx` |
| `GroupsList` | `components/groups/GroupsList.tsx` |
| `DevicesList` | `components/sms-gateway/DevicesList.tsx` |
| `PageLayout` | `components/layout/PageLayout.tsx` |
| `Card` | `components/ui/Card.tsx` |

---

## Hooks

### useToast
Toast notification management.

### useDebounce
Debounced value updates.

### useInfiniteScroll
Infinite scroll loading.

### usePagination
Pagination state management.

### useTransactions
Transaction data fetching with React Query.

### useMembers
Member data fetching with React Query.

### useGroups
Group data fetching with React Query.

---

## File Structure

```
src/components/
├── ui/                 # Core UI primitives
├── common/             # Shared components (animations, layouts)
├── layout/             # Page layouts
├── members/            # Member management
├── groups/             # Group management
├── Transactions/       # Transaction components
├── reports/            # Report components
├── admin/              # Admin-only components
├── settings/           # Settings pages
└── errors/             # Error handling components
```
