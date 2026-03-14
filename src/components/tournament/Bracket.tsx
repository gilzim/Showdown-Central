import { Trophy, Users } from "lucide-react";

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  winner?: string;
}

interface Round {
  name: string;
  matches: Match[];
}

interface BracketProps {
  rounds?: Round[];
}


function MatchCard({ match }: { match: Match }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden w-40">
      {[match.teamA, match.teamB].map((team) => (
        <div
          key={team}
          className={`flex items-center gap-2 px-3 py-2 text-sm ${
            match.winner === team
              ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
              : "text-zinc-700 dark:text-zinc-300"
          } border-b border-zinc-100 dark:border-zinc-700 last:border-0`}
        >
          <Users className="h-3 w-3 shrink-0 text-zinc-400" />
          <span className="truncate">{team}</span>
        </div>
      ))}
    </div>
  );
}

export default function Bracket({ rounds = [] }: BracketProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 p-6 overflow-x-auto">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Tournament Bracket
        </h2>
      </div>
      <div className="flex gap-12 min-w-max">
        {rounds.map((round) => (
          <div key={round.name} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2 text-center">
              {round.name}
            </p>
            <div className="flex flex-col justify-around flex-1 gap-4">
              {round.matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
