# Ibimina Mobile App

**Ibimina** is a digital-first savings group platform designed for the Rwandan context. It digitizes the traditional "Kimina" group savings experience, enforcing discipline through rigid contribution rules and facilitating transparency via a proven ledger system.

## 🚀 Mission
To provide a safe, transparent, and "USSD-only payment" platform for micro-savings groups, ensuring that money movement happens via trusted channels (MoMo) while the app acts as the immutable system of record.

## ✨ Key Features

### 1. Group Management
- **Public & Private Groups**: Users can join public groups (vetted by admins) or private groups (via invite code).
- **One User, One Group**: Strict enforcement to prevent over-leveraging. A user must belong to exactly one group to contribute.
- **Role-Based Access**:
    - **Chair**: Manages membership.
    - **Treasurer**: Reconciles contributions.
    - **Member**: Contributes and views progress.

### 2. Contribution Flow (Safe & USSD-Based)
- **No In-App Payments**: The app **never** touches money directly.
- **USSD Handoff**: The "Contribute" button launches the native phone dialer with the implementation-specific MoMo USSD code.
- **Proof of Payment**: Members upload proof (Tx ID / SMS) which must be verified by the Treasurer.

### 3. Smart Wallet & Ledger
- **Read-Only Wallet**: Users see a clear distinction between "Confirmed Savings" (safe) and "Pending" (awaiting approval).
- **Cap Enforcement**: Wallet balance is capped at **500,000 RWF** to maintain micro-savings focus.
- **Transparency**: Every transaction is logged and visible to the member.

### 4. Admin & Safety
- **Public Group Vetting**: System Admins must approve public groups before they appear in search results.
- **Reconciliation Loop**: Treasurers confirm funds receipt before the system credits a member's wallet.

## 🛠 Tech Stack
- **Framework**: Flutter (Mobile)
- **State Management**: Riverpod
- **Backend/Auth**: Supabase (PostgreSQL + RLS)
- **Architecture**: Feature-first, Clean Architecture

## 📱 Getting Started

### Prerequisites
- Flutter SDK (Latest Stable)
- Supabase Project (configured with schema)

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-org/ibimina.git
    ```
2.  Navigate to the mobile app:
    ```bash
    cd apps/mobile-app
    ```
3.  Install dependencies:
    ```bash
    flutter pub get
    ```
4.  Run the app:
    ```bash
    flutter run
    ```

## 🔐 Roles & Permissions

| Role | Capabilities |
| :--- | :--- |
| **Member** | Join group, Contribute (USSD), View Wallet, Fix Rejections |
| **Chair** | View Member List, Invite Users |
| **Treasurer** | Approve/Reject Pending Contributions |
| **Admin** | Approve/Reject Public Groups |

## 🤝 Contribution Guidelines
This project follows a strict **"USSD-Verified"** protocol. Do not attempt to add in-app payment gateways (Stripe, card, etc.). All money movement must remain external to ensure low fees and high trust in the local market.
