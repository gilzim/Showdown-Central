import BettingSlip from "@/components/betting/BettingSlip";
import SapsWallet from "@/components/betting/SapsWallet";

const openMatchups = [
  {
    id: "m1",
    tournamentName: "Summer Slam",
    teamA: "Thunder Hawks",
    teamB: "Shadow Wolves",
    oddsA: 1.8,
    oddsB: 2.1,
  },
  {
    id: "m2",
    tournamentName: "Summer Slam",
    teamA: "Iron Titans",
    teamB: "Blaze Squad",
    oddsA: 1.5,
    oddsB: 2.8,
  },
];

export default function BettingPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
        Betting
      </h1>
      <p className="text-zinc-500 mb-8">
        Place bets on live matchups using SAPS.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Open Matchups
          </h2>
          {openMatchups.map((matchup) => (
            <BettingSlip 
              key={matchup.id} 
              tournamentId={matchup.id}
              tournamentName={matchup.tournamentName}
              matchupId={matchup.id}
              teamA={{ id: 'teamA', name: matchup.teamA }}
              teamB={{ id: 'teamB', name: matchup.teamB }}
              oddsA={matchup.oddsA}
              oddsB={matchup.oddsB}
            />
          ))}
        </div>
        <div>
          <SapsWallet />
        </div>
      </div>
    </div>
  );
}
