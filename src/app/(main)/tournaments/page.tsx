import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TournamentCard from "@/components/tournament/TournamentCard";

export default async function TournamentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, game, mode, status, max_teams, prize_pool')
    .order('created_at', { ascending: false })

  // Fetch team counts for each tournament
  const tournamentList = tournaments || []
  const teamsCountData = tournamentList.length > 0
    ? await Promise.all(
        tournamentList.map(async (t) => {
          const { count } = await supabase
            .from('teams')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', t.id)
          return { id: t.id, count: count ?? 0 }
        })
      )
    : []

  const teamsCountMap = Object.fromEntries(teamsCountData.map((d) => [d.id, d.count]))

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Tournaments
          </h1>
          <p className="text-slate-500">Browse and join active tournaments.</p>
        </div>
        <Link
          href="/tournaments/host"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          + Host Tournament
        </Link>
      </div>

      {tournamentList.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-2xl">
          <p className="text-slate-500 text-lg">No tournaments yet.</p>
          <Link href="/tournaments/host" className="mt-4 inline-block py-2 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors">
            Host the First One
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tournamentList.map((t) => (
            <TournamentCard
              key={t.id}
              id={t.id}
              name={t.name}
              game={t.game}
              mode={t.mode as 'Manual' | 'Self-Reg'}
              status={t.status as 'upcoming' | 'active' | 'completed' | 'cancelled' | 'draft'}
              teamsCount={teamsCountMap[t.id] ?? 0}
              maxTeams={t.max_teams}
              prizePool={t.prize_pool}
            />
          ))}
        </div>
      )}
    </div>
  );
}
