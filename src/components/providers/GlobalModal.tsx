'use client'

import { useUIStore } from '@/store/useUIStore'
import * as LucideIcons from 'lucide-react'
import { X } from 'lucide-react'

export default function GlobalModal() {
  const { modal, closeModal } = useUIStore()

  if (!modal.isOpen) return null

  // Map variant to default icon and colors
  const getVariantDefaults = () => {
    switch (modal.variant) {
      case 'danger':
        return {
          icon: LucideIcons.ShieldAlert,
          color: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/20',
          glow: 'shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]',
          button: 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/10'
        }
      case 'warning':
        return {
          icon: LucideIcons.AlertTriangle,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
          glow: 'shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]',
          button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/10'
        }
      case 'success':
        return {
          icon: LucideIcons.CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          glow: 'shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]',
          button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/10'
        }
      default:
        return {
          icon: modal.type === 'confirm' ? LucideIcons.HelpCircle : LucideIcons.Info,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20',
          glow: 'shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]',
          button: 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/10'
        }
    }
  }

  const defaults = getVariantDefaults()
  
  // Resolve provided iconName or fallback to variant default
  let Icon = defaults.icon
  if (modal.iconName && (LucideIcons as any)[modal.iconName]) {
    Icon = (LucideIcons as any)[modal.iconName]
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700/50 rounded-[1.5rem] w-full max-w-md shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
        
        {/* Subtle top indicator */}
        <div className={`h-1 w-full opacity-50 ${
          modal.variant === 'danger' ? 'bg-red-500' :
          modal.variant === 'warning' ? 'bg-amber-500' :
          modal.variant === 'success' ? 'bg-emerald-500' :
          'bg-blue-500'
        }`} />

        <button 
          onClick={() => closeModal(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 sm:p-10 w-full">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-6 ${defaults.bg} ${defaults.glow} animate-in slide-in-from-bottom-2 duration-500`}>
            <Icon className={`w-8 h-8 ${defaults.color}`} />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {modal.title}
          </h2>
          
          <p className="text-slate-400 text-base mb-8 leading-relaxed max-w-[280px] mx-auto">
            {modal.message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full">
            {modal.type === 'confirm' && (
              <button
                onClick={() => closeModal(false)}
                className="w-full sm:w-auto min-w-[100px] px-5 py-2.5 text-slate-400 hover:text-slate-200 font-semibold transition-colors order-2 sm:order-1 text-sm"
              >
                {modal.cancelLabel}
              </button>
            )}
            <button
              onClick={() => closeModal(true)}
              className={`w-full sm:w-auto min-w-[120px] px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 order-1 sm:order-2 ${defaults.button}`}
            >
              {modal.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
