import TournamentBracket from '@/components/bracket/TournamentBracket'
import HostSettingsPanel from '@/components/bracket/HostSettingsPanel'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function HostDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
           <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Host a Tournament</h1>
          <p className="text-slate-400">Configure your event and manage the bracket.</p>
        </div>
      </div>
      
      <HostSettingsPanel />
      <TournamentBracket />
    </div>
  )
}

