# Showdown Central

**Showdown Central** is a Generic Tournament & Betting Platform built with [Next.js 15+](https://nextjs.org/), TypeScript, Tailwind CSS, and Supabase.

---

## Overview

Showdown Central lets organizers host tournaments across any game or sport, and lets players bet on match outcomes using the built-in **SAPS virtual economy**.

### Key Features

#### 🏆 Multi-Tenant Tournament Hosting
- **Manual Mode** — The host manually seeds teams and advances results round-by-round.
- **Self-Reg Mode** — Players or teams self-register with a unique `join_code`, filling the bracket automatically.
- Bracket visualization with round-by-round match tracking.

#### 💰 SAPS Virtual Economy
- Every player starts with **500 SAPS** (virtual currency).
- SAPS is earned and spent through the betting module and daily bonuses.
- Full transaction history stored per user.

#### 🎲 Betting Module
- Place bets on live matchups within active tournaments.
- Dynamic odds per matchup.
- Potential return calculated before confirming a bet.
- SAPS Wallet component shows real-time balance and recent transactions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| State Management | Zustand |
| Database / Auth | Supabase |

---

## Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/gilzim/Showdown-Central.git
   cd Showdown-Central
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Apply the database schema**
   Run `supabase_schema.sql` in the Supabase SQL editor (or via the Supabase CLI).

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Sidebar
│   ├── page.tsx            # Redirects to /dashboard
│   ├── dashboard/          # Dashboard overview
│   ├── tournaments/        # Tournament listing
│   ├── betting/            # Betting interface
│   └── profile/            # User profile
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── tournament/
│   │   ├── Bracket.tsx     # Tournament bracket visualization
│   │   └── TournamentCard.tsx
│   └── betting/
│       ├── BettingSlip.tsx # Per-matchup betting UI
│       └── SapsWallet.tsx  # SAPS balance & transactions
├── store/
│   └── useStore.ts         # Zustand global store
└── lib/
    └── supabaseClient.ts   # Supabase client initialization
supabase_schema.sql         # Database schema
```

---

## License

MIT
