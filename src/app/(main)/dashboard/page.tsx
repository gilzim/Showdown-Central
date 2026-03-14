import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Coins, Users, TrendingUp, LogOut, Swords } from 'lucide-react'
import Link from 'next/link'
import DashboardJoinButton from '@/components/dashboard/DashboardJoinButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch tournaments hosted by this user
  const { data: hostedTournaments } = await supabase
    .from('tournaments')
    .select('id, name, status')
    .eq('host_id', user.id)
    .in('status', ['draft', 'upcoming', 'active'])
    .order('created_at', { ascending: false })
    .limit(5)

  const activeTournaments = hostedTournaments ?? []

  // Fetch tournaments where the user is a team member (Joined by You)
  const { data: joinedTeamsData } = await supabase
    .from('team_members')
    .select(`
      team_id,
      teams (
        id,
        name,
        tournament_id,
        tournaments (
          id,
          name,
          status
        )
      )
    `)
    .eq('user_id', user.id)
    .limit(5)

  const joinedTournaments = (joinedTeamsData ?? []).map((tm: any) => ({
    id: tm.teams.id,
    name: tm.teams.name,
    tournament_id: tm.teams.tournament_id,
    tournaments: tm.teams.tournaments
  }))

  // Fetch active bets (Matchup bets)
  const { data: matchupBets } = await supabase
    .from('bets')
    .select('id, amount, status, team_id, teams(name), matchups(id, tournament_id, tournaments(name))')
    .eq('bettor_id', user.id)
    .eq('status', 'pending')
    .limit(5)

  // Fetch active bets (Prop bets)
  const { data: propBets } = await supabase
    .from('user_prop_bets')
    .select('id, amount, status, prop_bets(question)')
    .eq('bettor_id', user.id)
    .eq('status', 'pending')
    .limit(5)

  const allActiveBets = [
    ...(matchupBets || []).map(b => {
      const team = Array.isArray(b.teams) ? b.teams[0] : b.teams
      const matchup = Array.isArray(b.matchups) ? b.matchups[0] : b.matchups
      const tournament = Array.isArray(matchup?.tournaments) ? matchup.tournaments[0] : matchup?.tournaments
      return {
        id: b.id,
        amount: b.amount,
        label: `${team?.name || 'Unknown'} in ${tournament?.name || 'Tournament'}`,
        type: 'Matchup'
      }
    }),
    ...(propBets || []).map(b => {
      const propBet = Array.isArray(b.prop_bets) ? b.prop_bets[0] : b.prop_bets
      return {
        id: b.id,
        amount: b.amount,
        label: propBet?.question || 'Prop Bet',
        type: 'Prop'
      }
    })
  ]

  // For logout button
  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center w-full mb-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Welcome, {profile?.username || user.email?.split('@')[0]}
          </h1>
          <p className="text-slate-400 mt-2">Manage your tournaments and wagers.</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Saps Balance</span>
            <span className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              {profile?.saps_balance ?? 500}
            </span>
          </div>

          <form action={signOut}>
            <button className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all font-semibold" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Live Tournaments Card */}
        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-3 text-blue-400 pb-4 border-b border-slate-700/50">
            <Trophy className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-100">My Tournaments</h2>
          </div>

          {activeTournaments.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {activeTournaments.map((t) => (
                <li key={t.id} className="flex items-center gap-2 group">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-slate-200 font-semibold truncate flex-1 text-sm">{t.name}</span>
                  <Link
                    href={`/tournaments/${t.id}/manage`}
                    className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg font-bold transition-colors"
                  >
                    <Swords className="w-3 h-3" />
                    Manage
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 py-4 text-sm italic">You haven't created any tournaments yet.</p>
          )}

          <Link
            href="/tournaments/host"
            className="mt-auto py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-center w-full block"
          >
            Host New Tournament
          </Link>
        </div>

        {/* Joined Tournaments Card */}
        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-3 text-emerald-400 pb-4 border-b border-slate-700/50">
            <Users className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-100">Joined by You</h2>
          </div>
          
          {joinedTournaments.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {joinedTournaments.map((jt: any) => {
                const tournament = Array.isArray(jt.tournaments) ? jt.tournaments[0] : jt.tournaments
                if (!tournament) return null
                return (
                  <li key={jt.id} className="flex items-center gap-2 group">
                    <span className="text-slate-200 font-semibold truncate flex-1 text-sm">{tournament.name}</span>
                    <span className="text-xs text-slate-500 italic">as {jt.name}</span>
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      className="shrink-0 text-xs px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg font-bold transition-colors"
                    >
                      View
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-slate-400 py-4 text-sm italic">You haven't joined any brackets yet.</p>
          )}

          <DashboardJoinButton />
        </div>

        {/* Active Bets Card */}
        <div className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-xl flex flex-col gap-4 md:col-span-3 lg:col-span-1 border-emerald-500/20 shadow-emerald-900/10">
          <div className="flex items-center gap-3 text-purple-400 pb-4 border-b border-slate-700/50">
            <TrendingUp className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-100">Active Bets</h2>
          </div>
          
          {allActiveBets.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {allActiveBets.map((bet) => (
                <li key={bet.id} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{bet.type} Bet</span>
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <Coins className="w-3 h-3" /> {bet.amount}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium leading-tight">{bet.label}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 py-4 text-sm italic">No open wagers. Find a live tournament to bet!</p>
          )}

          <Link
            href="/betting"
            className="mt-auto py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 font-bold rounded-xl transition-colors text-center w-full block"
          >
            Go to Betting Arena
          </Link>
        </div>
      </div>
    </div>
  )
}
