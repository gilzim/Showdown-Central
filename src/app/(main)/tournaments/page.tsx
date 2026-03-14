import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TournamentFilter from "@/components/tournament/TournamentFilter";

export default async function TournamentsPage() {
  const supabase = await createClient();

  // Fetch tournaments and count the teams joined for each
  const { data: tournamentsData } = await supabase
    .from("tournaments")
    .select(`
      id,
      name,
      game,
      mode,
      status,
      max_teams,
      prize_pool,
      teams(count)
    `)
    .order("created_at", { ascending: false });

  const tournaments = (tournamentsData || []).map((t) => ({
    id: t.id,
    name: t.name,
    game: t.game,
    mode: t.mode as "Manual" | "Self-Reg",
    status: t.status as "upcoming" | "active" | "completed",
    teamsCount: t.teams?.[0]?.count ?? 0,
    maxTeams: t.max_teams,
    prizePool: t.prize_pool,
  }));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
            Tournaments
          </h1>
          <p className="text-zinc-500">Browse and join active tournaments.</p>
        </div>
        <Link href="/tournaments/host" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          + Host Tournament
        </Link>
      </div>

      <TournamentFilter tournaments={tournaments} />
    </div>
  );
}
