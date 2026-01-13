# Design System Standard (Global) — Soft Liquid Glass + Minimalist + World-class

## Goals
- Minimalist, clean, high signal-to-noise
- “Soft Liquid Glass” aesthetic where appropriate (blur + translucency + subtle border + depth)
- Motion is subtle, purposeful, and never blocks usability

## Tokens (name them once, use everywhere)
Use CSS variables (or equivalent) as the source of truth:
- --radius-xs/sm/md/lg/xl/2xl
- --space-1..12
- --glass-bg (translucent surface)
- --glass-border (subtle hairline)
- --glass-blur (blur strength)
- --shadow-1..4 (soft depth)
- --text-1/2/3 (hierarchy)
- --accent (brand/action), --danger, --warning, --success

## Glass surfaces (rules)
- Glass must never reduce readability. If the background is noisy: increase opacity, add backdrop tint, or reduce blur.
- Borders are hairline + low contrast; shadows are soft, not harsh.
- Prefer fewer layers; depth is for hierarchy, not decoration.

## Layout & hierarchy
- Always establish: page title → primary action → content → secondary actions
- Internal portals: clarity > decoration; tables and filters must be ergonomic.
- Mobile-first apps: thumb-reachable primary actions; avoid dense tables.

## States are mandatory
Every interactive page must have:
- loading (skeleton preferred)
- empty (helpful CTA)
- error (actionable + retry)
- success feedback (toast/snackbar)

## Motion
- Micro-interactions only: hover/press, open/close, list reorder, subtle page transitions
- Respect prefers-reduced-motion: animations become instant or near-instant
- Never animate layout in a way that causes jank on low-end phones

## Components must be consistent
Minimum shared set:
Button, Input, Select, Textarea, Card, Modal/Drawer, Toast, Skeleton, Tabs, Table, Badge, Dropdown, Tooltip.
