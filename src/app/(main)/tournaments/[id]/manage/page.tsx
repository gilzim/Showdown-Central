import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ShieldAlert, Swords } from 'lucide-react'
import Link from 'next/link'
import HostManagePanel from '@/components/bracket/HostManagePanel'

export default async function HostManagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: tournamentId } = await params
  const supabase = await createClient()

  // 1. Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch tournament
  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('id, name, status, host_id, max_teams, mode, join_code')
    .eq('id', tournamentId)
    .single()

  if (tError || !tournament) {
    notFound()
  }

  // 3. Host-only guard
  if (tournament.host_id !== user.id) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-24 flex flex-col items-center gap-6 text-center">
        <div className="p-5 rounded-full bg-red-500/10 border border-red-500/20">
          <ShieldAlert className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Access Denied</h1>
        <p className="text-slate-400">
          Only the tournament host can access this management panel.
        </p>
        <Link
          href={`/tournaments/${tournamentId}`}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
        >
          View as Spectator
        </Link>
      </div>
    )
  }

  // 4. Fetch teams
  const { data: teamsData } = await supabase
    .from('teams')
    .select('id, name')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })

  // 5. Fetch matchups
  const { data: matchupsData } = await supabase
    .from('matchups')
    .select('id, round, position, team_a_id, team_b_id, team_a_score, team_b_score, winner_id, status')
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: true })
    .order('position', { ascending: true })

  const teams = (teamsData ?? []).map((t) => ({ id: t.id, name: t.name }))

  const matchups = (matchupsData ?? []).map((m) => ({
    id: String(m.id),
    round: m.round,
    position: m.position,
    team_a_id: m.team_a_id ?? null,
    team_b_id: m.team_b_id ?? null,
    team_a_score: m.team_a_score ?? null,
    team_b_score: m.team_b_score ?? null,
    winner_id: m.winner_id ?? null,
    status: (m.status ?? 'pending') as 'pending' | 'active' | 'completed',
  }))

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-700/50 text-slate-400 border-slate-600',
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    completed: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/40',
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/tournaments/host"
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-blue-400" />
              <h1 className="text-3xl font-extrabold text-white">{tournament.name}</h1>
              <span
                className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md border ${
                  statusColors[tournament.status] ?? statusColors.draft
                }`}
              >
                {tournament.status}
              </span>
            </div>
            <p className="text-slate-400 mt-1 ml-8">
              Host Management Panel · {teams.length} team{teams.length !== 1 ? 's' : ''}
              {tournament.mode === 'Self-Reg' && tournament.join_code && (
                <span className="ml-3 font-mono text-emerald-400">
                  Join code: <strong>{tournament.join_code}</strong>
                </span>
              )}
            </p>
          </div>
        </div>

        <Link
          href={`/tournaments/${tournamentId}`}
          className="text-sm px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg font-semibold transition-colors"
        >
          View Spectator Page ↗
        </Link>
      </div>

      {/* Main panel */}
      <HostManagePanel
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        initialTeams={teams}
        initialMatchups={matchups}
        initialStatus={tournament.status as 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled'}
      />
    </div>
  )
}
