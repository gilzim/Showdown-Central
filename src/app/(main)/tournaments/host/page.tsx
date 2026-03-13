import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Trophy, PlusCircle, Swords, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import HostSettingsPanel from '@/components/bracket/HostSettingsPanel'
import TournamentBracket from '@/components/bracket/TournamentBracket'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'Draft',     color: 'text-slate-400 bg-slate-700/50 border-slate-600',       icon: null },
  upcoming:  { label: 'Upcoming',  color: 'text-blue-400 bg-blue-500/20 border-blue-500/40',       icon: <Clock className="w-3 h-3" /> },
  active:    { label: 'Live',      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40', icon: <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> },
  completed: { label: 'Completed', color: 'text-purple-400 bg-purple-500/20 border-purple-500/40', icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-500/20 border-red-500/40',         icon: <XCircle className="w-3 h-3" /> },
}

export default async function HostDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch host's existing tournaments
  const { data: myTournaments } = await supabase
    .from('tournaments')
    .select('id, name, status, max_teams, mode, created_at')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  const tournaments = myTournaments ?? []

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-10">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Host a Tournament</h1>
          <p className="text-slate-400">Configure your event and manage the bracket.</p>
        </div>
      </div>

      {/* My Tournaments Section */}
      {tournaments.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest">My Tournaments</h2>
            <span className="text-slate-500 text-sm font-semibold">({tournaments.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tournaments.map((t) => {
              const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.draft
              return (
                <div
                  key={t.id}
                  className="flex flex-col gap-4 p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl hover:border-slate-600 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                      <h3 className="font-bold text-white truncate">{t.name}</h3>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold uppercase rounded-md border ${cfg.color}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>{t.max_teams} teams · {t.mode}</span>
                    <span className="ml-auto">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/tournaments/${t.id}/manage`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      <Swords className="w-4 h-4" />
                      Manage
                    </Link>
                    <Link
                      href={`/tournaments/${t.id}`}
                      className="flex items-center justify-center px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 rounded-xl transition-colors text-sm font-semibold"
                    >
                      Spectate
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Create New Tournament Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-xl font-black text-white uppercase tracking-widest">
            {tournaments.length > 0 ? 'Create New Tournament' : 'Create Your First Tournament'}
          </h2>
          <PlusCircle className="w-5 h-5 text-blue-400" />
        </div>

        <HostSettingsPanel />
        <TournamentBracket />
      </section>
    </div>
  )
}
