/**
 * Shared tournament status metadata used across pages.
 * Centralised here to avoid drift between profile, host dashboard, and other views.
 */

export type TournamentStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled'

export const TOURNAMENT_STATUS_LABEL: Record<TournamentStatus, string> = {
  draft:     'Draft',
  upcoming:  'Upcoming',
  active:    'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/**
 * Tailwind classes for tournament status badges.
 * Each string includes text colour, background, and border colour so it can be
 * dropped directly into a `border` element:
 *   <span className={`... border ${TOURNAMENT_STATUS_COLOR[status]}`}>
 */
export const TOURNAMENT_STATUS_COLOR: Record<TournamentStatus, string> = {
  draft:     'text-slate-400 bg-slate-700/50 border-slate-600',
  upcoming:  'text-blue-400 bg-blue-500/20 border-blue-500/40',
  active:    'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
  completed: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
  cancelled: 'text-red-400 bg-red-500/20 border-red-500/40',
}
