# Monorepo Standard (Global)

## Structure
- Keep shared UI/components and shared types/contracts in packages/
- Keep app-specific logic inside apps/
- Avoid duplicating schemas or utilities across apps

## Change policy
- Small diffs; no drive-by refactors
- Shared changes must be backwards compatible or versioned
