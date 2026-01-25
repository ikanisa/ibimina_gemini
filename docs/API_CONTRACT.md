# API Contract

## Overview
This document defines the interface between the Ibimina Flutter App and the Supabase Backend.
We use a mix of **PostgREST** (Direct Table/View Access) and **RPC** (Stored Procedures).

## 1. Auth & Profiles
- **Profile**: `public.profiles` (Read: Self/Staff, Update: Self)
- **Membership**: `public.members` (One active membership per user)

## 2. Groups
- **List Public Groups**: `SELECT * FROM groups WHERE type = 'PUBLIC' AND status = 'ACTIVE'`
- **Create Group**: `RPC public.create_group(...)`
- **Join Group**: `RPC public.join_group(...)` (Handles invite logic)

## 3. Contributions
- **Submit**: `INSERT INTO contribution_submissions` (RLS enforced)
- **View History**: `SELECT * FROM contribution_submissions WHERE user_id = auth.uid()`

## 4. Leaderboard (New)
- **Endpoint**: `view_leaderboard_monthly`
- **Type**: View (Read-Only)
- **Access**: Publicly readable (Authenticated)
- **Schema**:
  ```sql
  group_id: uuid
  group_name: text
  confirmed_total: numeric
  member_count: integer
  rank: integer
  ```
- **Filter**: `type = PUBLIC` is strictly enforced in the view definition.

## 5. Constraints (Server-Enforced)
- **Contribution Cap**: Max 4,000 RWF per transaction (Trigger).
- **Wallet Cap**: Max 500,000 RWF total confirmed balance (Trigger).
- **Membership**: Unique constraint on `user_id` inside `group_members` (or logical equivalent).
