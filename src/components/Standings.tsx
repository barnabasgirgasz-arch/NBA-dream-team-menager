import React from 'react';
import { Team, Player } from '../types';
import { getMvpLeaderboard, getPlayerMvpScore } from '../utils/mvp';
import { Trophy, Star, TrendingUp, ShieldAlert, Award, Crown } from 'lucide-react';

interface StandingsProps {
  teams: Team[];
  players: Player[];
  seasonMvpId?: string | null;
  isSeasonEnded?: boolean;
}

export default function Standings({
  teams,
  players,
  seasonMvpId = null,
  isSeasonEnded = false
}: StandingsProps) {
  // Sort teams by Wins descending, then points ratio
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
  });

  // Filter players who played at least 1 game to show leaderboards
  const activePlayers = players.filter(p => p.stats.gamesPlayed > 0);

  const mvpLeaderboard = getMvpLeaderboard(players, 5);
  const seasonMvpPlayer = seasonMvpId ? players.find(p => p.id === seasonMvpId) : null;
  const seasonMvpTeam = seasonMvpPlayer ? teams.find(t => t.id === seasonMvpPlayer.teamId) : null;

  const topScorers = [...activePlayers]
    .sort((a, b) => b.stats.ppg - a.stats.ppg)
    .slice(0, 5);

  const topRebounders = [...activePlayers]
    .sort((a, b) => b.stats.rpg - a.stats.rpg)
    .slice(0, 5);

  const topAssists = [...activePlayers]
    .sort((a, b) => b.stats.apg - a.stats.apg)
    .slice(0, 5);

  const renderPlayerNameWithMvp = (player: Player) => (
    <p className="font-bold text-slate-300 truncate flex items-center gap-1.5">
      {seasonMvpId === player.id && (
        <span title="Szezon MVP (PPG + RPG + APG)" className="inline-flex items-center shrink-0">
          <Trophy className="h-3.5 w-3.5 text-amber-400 fill-amber-400/25 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
        </span>
      )}
      <span className="truncate">{player.name}</span>
    </p>
  );

  return (
    <div className="space-y-6" id="standings-tab">
      {/* OFFICIAL SEASON MVP SPOTLIGHT BANNER AT END OF SEASON */}
      {isSeasonEnded && seasonMvpPlayer && (
        <div
          id="season-mvp-banner"
          className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-orange-500/15 border border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
                <Trophy className="h-8 w-8 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                  Hivatalos Szezon MVP Díjazott
                </p>
                <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                  <Trophy className="h-5 w-5 text-amber-400 fill-amber-400/30 shrink-0" />
                  <span>{seasonMvpPlayer.name}</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {seasonMvpTeam ? `${seasonMvpTeam.city} ${seasonMvpTeam.name}` : 'Szabadügynök'} • {seasonMvpPlayer.position} • OVR {seasonMvpPlayer.ovr}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 bg-slate-950/75 border border-slate-800 rounded-xl p-3.5 text-center">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">PPG</p>
                <p className="text-base font-black font-mono text-orange-400">{seasonMvpPlayer.stats.ppg.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">RPG</p>
                <p className="text-base font-black font-mono text-purple-400">{seasonMvpPlayer.stats.rpg.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">APG</p>
                <p className="text-base font-black font-mono text-blue-400">{seasonMvpPlayer.stats.apg.toFixed(1)}</p>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <p className="text-[10px] text-amber-400 font-bold uppercase">MVP Index</p>
                <p className="text-base font-black font-mono text-amber-300">{getPlayerMvpScore(seasonMvpPlayer).toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STANDINGS TABLE (2 Columns span) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Trophy className="h-5 w-5 text-amber-500" />
            NBA Liga Csoporttábla
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 uppercase font-bold text-[10px]">
                  <th className="py-3 px-2 text-center w-8">Hely</th>
                  <th className="py-3 px-3">Csapat</th>
                  <th className="py-3 px-2 text-center w-12">GY</th>
                  <th className="py-3 px-2 text-center w-12">V</th>
                  <th className="py-3 px-2 text-center w-16">Arány</th>
                  <th className="py-3 px-3 text-center w-24">Dobott/Kapott</th>
                  <th className="py-3 px-2 text-center w-16">Forma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 font-medium">
                {sortedTeams.map((team, index) => {
                  const totalGames = team.wins + team.losses;
                  const ratio = totalGames > 0 ? (team.wins / totalGames).toFixed(3) : '.000';
                  const pDiff = team.pointsFor - team.pointsAgainst;

                  return (
                    <tr
                      key={team.id}
                      className={`hover:bg-slate-850/30 transition-colors ${
                        team.isUser ? 'bg-amber-500/5 font-bold border-l-2 border-l-amber-500' : ''
                      }`}
                    >
                      <td className="py-3.5 px-2 text-center text-slate-400 font-mono">
                        {index + 1}.
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-6 w-6 rounded bg-gradient-to-tr ${team.color} flex items-center justify-center font-black text-[10px] text-white`}>
                            {team.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-slate-200">{team.city} {team.name}</p>
                            {team.isUser && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.25 rounded font-bold">
                                SAJÁT CSAPAT
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center text-emerald-400 font-bold font-mono">
                        {team.wins}
                      </td>
                      <td className="py-3.5 px-2 text-center text-rose-400 font-bold font-mono">
                        {team.losses}
                      </td>
                      <td className="py-3.5 px-2 text-center text-slate-300 font-mono">
                        {ratio}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {team.pointsFor}:{team.pointsAgainst}{' '}
                        <span className={`text-[10px] ${pDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          ({pDiff >= 0 ? '+' : ''}{pDiff})
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          team.streak.startsWith('W') || team.streak.startsWith('GY')
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : team.streak.startsWith('L') || team.streak.startsWith('V')
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {team.streak}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* INDIVIDUAL LEADERBOARDS (1 Column span) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Star className="h-5 w-5 text-amber-500" />
            Egyéni Statisztikai Listák
          </h2>

          {activePlayers.length > 0 ? (
            <div className="space-y-6">

              {/* MVP RACE / SEASON MVP RANKING (PPG + RPG + APG) */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                  {isSeasonEnded ? 'Szezon MVP Végeredmény (PPG+RPG+APG)' : 'MVP Versenyfutás (PPG+RPG+APG)'}
                </h4>
                <div className="divide-y divide-slate-850 bg-slate-950/60 rounded-xl p-2.5 border border-amber-500/20">
                  {mvpLeaderboard.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center py-2 text-xs gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`font-mono text-[10px] font-bold ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                          {i + 1}.
                        </span>
                        {renderPlayerNameWithMvp(p)}
                      </div>
                      <span className="font-bold text-amber-400 font-mono shrink-0">
                        {getPlayerMvpScore(p).toFixed(1)} MVP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* TOP SCORERS */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-orange-500" /> Top Pontszerzők (PPG)
                </h4>
                <div className="divide-y divide-slate-850 bg-slate-950/40 rounded-xl p-2.5 border border-slate-850">
                  {topScorers.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center py-2 text-xs gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-500 font-mono text-[10px]">{i + 1}.</span>
                        {renderPlayerNameWithMvp(p)}
                      </div>
                      <span className="font-bold text-orange-400 font-mono shrink-0">{p.stats.ppg.toFixed(1)} PTS</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP REBOUNDERS */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-purple-500" /> Top Lepattanózók (RPG)
                </h4>
                <div className="divide-y divide-slate-850 bg-slate-950/40 rounded-xl p-2.5 border border-slate-850">
                  {topRebounders.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center py-2 text-xs gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-500 font-mono text-[10px]">{i + 1}.</span>
                        {renderPlayerNameWithMvp(p)}
                      </div>
                      <span className="font-bold text-purple-400 font-mono shrink-0">{p.stats.rpg.toFixed(1)} REB</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP ASSISTS */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-blue-500" /> Top Gólpasszok (APG)
                </h4>
                <div className="divide-y divide-slate-850 bg-slate-950/40 rounded-xl p-2.5 border border-slate-850">
                  {topAssists.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center py-2 text-xs gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-500 font-mono text-[10px]">{i + 1}.</span>
                        {renderPlayerNameWithMvp(p)}
                      </div>
                      <span className="font-bold text-blue-400 font-mono shrink-0">{p.stats.apg.toFixed(1)} AST</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-8 text-center text-slate-500 text-xs">
              📊 Játssz le legalább egy mérkőzést, hogy az egyéni statisztikai rangsorok feltöltődjenek!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
