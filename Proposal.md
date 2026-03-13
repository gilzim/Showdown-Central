# Project Proposal: Showdown Central

## 1. Project Overview

Showdown Central is a modern, web-based platform designed for hosting and managing tournaments with an integrated social betting ecosystem. The platform transitions from a static single-page application to a dynamic, multi-tenant system using a **Next.js** frontend and **Supabase** backend. It features a unique virtual currency called **SAPS**, allowing users to wager on tournament outcomes and global community challenges.

---

## 2. Core Architecture

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 15+ (App Router) with TypeScript |
| **Styling & UI** | Tailwind CSS and Lucide React |
| **State Management** | Zustand (User Profile, SAPS balance, Active Tournaments) |
| **Backend & Database** | Supabase (PostgreSQL) for data persistence and authentication |
| **Real-time Layer** | Supabase Realtime for instant bracket updates and ledger syncing |

---

## 3. Core Modules & Features

### A. Tournament Engine

- **Multi-Tenant Hosting:** Any user can create and host a tournament.
- **Dynamic Brackets:** Support for 4, 6, 8, 16, and 32-team single-elimination brackets.
- **Roster Modes:**
  - *Manual Mode:* Host manually enters and manages team names/players.
  - *Self-Registration Mode:* Users join a tournament via a unique 6-digit join code.
- **Automated Advancement:** Integrated PostgreSQL logic (`advance_team`) to automatically promote winners through bracket rounds.

### B. SAPS Economy (Virtual Currency)

- **Initial Balance:** New users start with **500 SAPS**.
- **Bankruptcy Protection:** A "Refill" mechanism that resets a user's balance to 500 SAPS only if their balance hits exactly 0.
- **Transaction Ledger:** A persistent log of all SAPS movements (bets placed, wins, refills) for audit and history.

### C. Betting Module

- **Tournament Betting:**
  - *Auto-generated Bets:* System creates "Matchup Winner" bets for every bracket game.
  - *Custom Host Bets:* Tournament hosts can create "Prop Bets" (e.g., "Will there be a shutout?").
- **Global Betting:** A separate dashboard for community-wide challenges not tied to specific tournaments.
- **Escrow System:** SAPS are deducted upon wagering and held until the "Oracle" (Host or Creator) settles the bet.

---

## 4. Implementation Requirements

### Database Schema (Supabase)

| Table | Description |
|---|---|
| `profiles` | User data including `saps_balance` |
| `tournaments` | Metadata, `join_code`, `creator_id`, and `reg_type` |
| `matchups` | Bracket structure, team IDs (`t1_id`, `t2_id`), and `winner_id` |
| `bets` | Definition of wagers (Global or Tournament-linked) |
| `wagers` | User-specific bet entries |
| `transactions` | Historical ledger of SAPS changes |

### Security Policies (Row Level Security)

- Only the **Tournament Creator** can update scores and advance teams.
- Users can only view their own private betting history but can view public bracket data.
- SAPS balance modifications must be handled via secure **Database Functions (RPCs)** to prevent client-side manipulation.

---

## 5. Roadmap Summary

1. **Foundation** — Next.js scaffolding, Supabase Auth, and Profile initialization.
2. **Tournament Core** — Bracket visualization and the `advance_team` logic.
3. **Economy** — Wallet implementation, transaction logging, and refill logic.
4. **Social Layer** — Join codes, self-registration, and global betting dashboards.