import Link from "next/link";
import { Trophy, Users, Coins, Settings2 } from "lucide-react";

export interface TournamentCardProps {
  id: string;
  name: string;
  game: string;
  mode: "Manual" | "Self-Reg";
  status: "upcoming" | "active" | "completed" | "draft" | "cancelled";
  teamsCount: number;
  maxTeams: number;
  prizePool: number;
}

const statusStyles: Record<TournamentCardProps["status"], string> = {
  upcoming:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  completed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  draft: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function TournamentCard({
  id,
  name,
  game,
  mode,
  status,
  teamsCount,
  maxTeams,
  prizePool,
}: TournamentCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
            {name}
          </h3>
          <p className="text-sm text-zinc-500 mt-0.5">{game}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[status]}`}
        >
          {status}
        </span>
      </div>

      <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-400" />
          <span>
            {teamsCount} / {maxTeams} teams
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-zinc-400" />
          <span>{prizePool.toLocaleString()} SAPS prize pool</span>
        </div>
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-zinc-400" />
          <span>{mode} mode</span>
        </div>
      </div>

      <Link
        href={`/tournaments/${id}`}
        className="mt-auto w-full rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white text-center flex items-center justify-center gap-1.5"
      >
        <Trophy className="inline h-4 w-4" />
        View Bracket
      </Link>
    </div>
  );
}
