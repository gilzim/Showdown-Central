import Link from "next/link";
import TournamentCard from "@/components/tournament/TournamentCard";

const sampleTournaments = [
  {
    id: "t1",
    name: "Spring Showdown",
    game: "Chess",
    mode: "Manual" as const,
    status: "upcoming" as const,
    teamsCount: 8,
    maxTeams: 16,
    prizePool: 1000,
  },
  {
    id: "t2",
    name: "Summer Slam",
    game: "Street Fighter 6",
    mode: "Self-Reg" as const,
    status: "active" as const,
    teamsCount: 12,
    maxTeams: 16,
    prizePool: 2500,
  },
  {
    id: "t3",
    name: "Autumn Cup",
    game: "Rocket League",
    mode: "Self-Reg" as const,
    status: "upcoming" as const,
    teamsCount: 4,
    maxTeams: 8,
    prizePool: 500,
  },
];

export default function TournamentsPage() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
            Tournaments
          </h1>
          <p className="text-zinc-500">Browse and join active tournaments.</p>
        </div>
        <Link href="/tournaments/host" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          + Host Tournament
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sampleTournaments.map((t) => (
          <TournamentCard key={t.id} {...t} />
        ))}
      </div>
    </div>
  );
}
