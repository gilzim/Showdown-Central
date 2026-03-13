import BettingSlip from "@/components/betting/BettingSlip";
import SapsWallet from "@/components/betting/SapsWallet";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_ODDS_A = 1.85;
const DEFAULT_ODDS_B = 2.05;

export default async function BettingPage() {
  const supabase = await createClient();

  // Fetch active matchups from active tournaments
  const { data: matchups } = await supabase
    .from("matchups")
    .select(
      `id, team_a_id, team_b_id, odds_a, odds_b, tournament_id,
       tournaments!inner(id, name, status)`
    )
    .eq("status", "active")
    .eq("tournaments.status", "active");

  const activeMatchups = matchups ?? [];

  // Fetch team names for all matchup participants
  const teamIds = [
    ...new Set(
      activeMatchups.flatMap((m) =>
        [m.team_a_id, m.team_b_id].filter(Boolean)
      )
    ),
  ];

  const teamMap: Record<string, string> = {};
  if (teamIds.length > 0) {
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds);
    (teams ?? []).forEach((t) => {
      teamMap[t.id] = t.name;
    });
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
        Betting
      </h1>
      <p className="text-zinc-500 mb-8">
        Place bets on live matchups using SAPS.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Open Matchups
          </h2>
          {activeMatchups.length === 0 ? (
            <p className="text-zinc-500">No live matchups right now.</p>
          ) : (
            activeMatchups.map((matchup) => {
              const tournament = Array.isArray(matchup.tournaments)
                ? matchup.tournaments[0]
                : (matchup.tournaments as unknown as {
                    id: string;
                    name: string;
                    status: string;
                  });
              
              if (!tournament) return null;
              return (
                <BettingSlip
                  key={matchup.id}
                  tournamentId={matchup.tournament_id}
                  tournamentName={tournament.name}
                  matchupId={matchup.id}
                  teamA={{
                    id: matchup.team_a_id,
                    name: teamMap[matchup.team_a_id] ?? "TBD",
                  }}
                  teamB={{
                    id: matchup.team_b_id,
                    name: teamMap[matchup.team_b_id] ?? "TBD",
                  }}
                  oddsA={matchup.odds_a ?? DEFAULT_ODDS_A}
                  oddsB={matchup.odds_b ?? DEFAULT_ODDS_B}
                />
              );
            })
          )}
        </div>
        <div>
          <SapsWallet />
        </div>
      </div>
    </div>
  );
}
