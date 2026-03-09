'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthUI() {
  const supabase = createClient()

  return (
    <div className="w-full max-w-md p-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
      <div className="mb-8 text-center">
         <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
           Welcome to the Arena
         </h2>
         <p className="mt-2 text-slate-400">Sign in to manage your tournaments</p>
      </div>
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#3b82f6',
                brandAccent: '#2563eb',
                inputText: 'white',
                inputBackground: 'rgba(30, 41, 59, 0.5)',
                inputBorder: 'rgba(51, 65, 85, 0.5)',
                inputBorderHover: '#3b82f6',
                inputBorderFocus: '#3b82f6',
              },
            },
          },
          className: {
            container: 'auth-container',
            button: 'auth-button transition-all duration-200',
            input: 'auth-input transition-all duration-200',
            message: 'text-red-400',
          }
        }}
        theme="dark"
        providers={['google']}
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=/dashboard`}
      />
    </div>
  )
}
