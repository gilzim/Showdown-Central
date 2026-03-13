'use client'

import { useEffect, useState } from 'react'
import ManualAuthForm from './ManualAuthForm'

export default function AuthUI() {
  const [hasEnv, setHasEnv] = useState(true)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setHasEnv(false)
      console.error('Supabase Environment Variables are missing!')
    }
  }, [])

  return (
    <div className="w-full max-w-md p-8 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
      <div className="mb-8 text-center text-white">
         <h2 className="text-3xl font-bold mb-2">Welcome to the Arena</h2>
         <p className="text-slate-400">Sign in to manage your tournaments</p>
         {!hasEnv && (
           <div className="p-3 mt-4 bg-red-900/30 border border-red-500/50 rounded-lg">
             <p className="text-red-400 text-sm font-bold">⚠️ Supabase Environment Variables Missing</p>
             <p className="text-red-300/70 text-xs mt-1">Check your .env.local file and restart the dev server.</p>
           </div>
         )}
      </div>
      
      <ManualAuthForm />
      
      <p className="mt-8 text-center text-xs text-slate-500">
        By continuing, you agree to our terms of service and privacy policy.
      </p>
    </div>
  )
}
