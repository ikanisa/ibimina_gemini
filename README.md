<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SACCO+ Admin Portal

A group savings and group savings-backed loans management system for SACCOs (Savings and Credit Cooperative Organizations) and MFIs (Microfinance Institutions).

## Tech Stack

- **Frontend:** React 19 with TypeScript
- **Build Tool:** Vite
- **Backend/Database:** Supabase (PostgreSQL with REST API)
- **UI Framework:** Tailwind CSS with Lucide icons
- **AI Integration:** Google AI Studio / Gemini API

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and configure the required variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `GEMINI_API_KEY` - (Optional) Your Gemini API key for AI features
   - `VITE_USE_MOCK_DATA` - (Optional) Set to `true` to run the UI with demo data

3. Run the app:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL (e.g., `https://yourproject.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous/public API key |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI features |
| `VITE_USE_MOCK_DATA` | No | Set to `true` to run the UI in demo mode without Supabase data |

> **Note:** Never commit `.env.local` to version control. The `.gitignore` is configured to exclude `*.local` files.

## Features

- Dashboard with KPIs
- Group Management (CRUD operations)
- Member Management
- Loan Management
- Transaction Tracking
- Mobile Money SMS Parsing
- SACCO Management
- Staff Management with Role-Based Access Control (RBAC)
- Reconciliation Module
- Token/Wallet System

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

View your app in AI Studio: https://ai.studio/apps/drive/1M1b8VEmqynqqhv_ON6DRy4pYiGbj7vVd
