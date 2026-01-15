---
description: Generate a comprehensive README.md for the project with modern formatting, badges, diagrams, and complete documentation
---

# /readme-comprehensive

## Purpose
Create a world-class README.md that serves as the single source of truth for the project.

## Steps

1. **Gather project information**
   - Read `package.json` for dependencies and scripts
   - List `src/` structure for architecture overview
   - List `supabase/functions/` for Edge Functions
   - List `supabase/migrations/` for migration count
   - Read existing docs (`ARCHITECTURE.md`, `AUDIT_REPORT.md`)

2. **Include these sections**
   - Header with badges (version, node, TypeScript, React, build status)
   - Overview with mermaid flowchart of core workflow
   - Quick Start (prerequisites, installation, environment, running)
   - Architecture (tech stack table, project structure tree, patterns)
   - Roles & Access (RBAC table, enforcement layers)
   - Features (Dashboard, Transactions, Directory, Reports, Settings)
   - Edge Functions (table with all functions and purposes)
   - Database (key tables, security model)
   - Testing (unit, E2E, critical flows)
   - Deployment (Cloudflare, Supabase, environments)
   - Documentation links table
   - Development commands table
   - Security (non-negotiables, compliance)
   - Production readiness status table
   - Contributing guidelines

3. **Formatting standards**
   - Use tables for structured data
   - Use mermaid for diagrams
   - Use code blocks with syntax highlighting
   - Use collapsible sections for verbose content
   - Keep sections scannable with bullet points

4. **Verification**
   // turbo
   - Run `npm run build` to ensure no broken references
   - Verify all linked docs exist
