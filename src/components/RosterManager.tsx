import React, { useState } from 'react';
import { Player, Position } from '../types';
import PlayerCard from './PlayerCard';
import CourtView from './CourtView';
import { Search, SlidersHorizontal, UserPlus, UserMinus, Sparkles, Shield, Flame, ShoppingBag } from 'lucide-react';

interface RosterManagerProps {
  players: Player[];
  onToggleStarter: (playerId: string) => void;
  onSignPlayer: (playerId: string) => void;
  onReleasePlayer: (playerId: string) => void;
  salaryCap: number;
  totalPayroll: number;
  onNavigateToMarket?: () => void;
  seasonMvpId?: string | null;
}

export default function RosterManager({
  players,
  onToggleStarter,
  onSignPlayer,
  onReleasePlayer,
  salaryCap,
  totalPayroll,
  onNavigateToMarket,
  seasonMvpId
}: RosterManagerProps) {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL');
  const [rosterTab, setRosterTab] = useState<'roster' | 'free_agents'>('roster');

  const userPlayers = players.filter((p) => p.teamId === 'user_team');
  const freeAgents = players.filter((p) => p.teamId === 'free_agent');
  const starters = userPlayers.filter((p) => p.isStarter);
  const bench = userPlayers.filter((p) => !p.isStarter);

  // Calculate team stats based on starters
  const teamOvr = starters.length > 0 
    ? Math.round(starters.reduce((acc, p) => acc + p.ovr, 0) / starters.length) 
    : 0;
  const teamOffense = starters.length > 0 
    ? Math.round(starters.reduce((acc, p) => acc + (p.shooting3pt + p.pointsInside + p.playmaking) / 3, 0) / starters.length) 
    : 0;
  const teamDefense = starters.length > 0 
    ? Math.round(starters.reduce((acc, p) => acc + (p.defense + p.rebounding) / 2, 0) / starters.length) 
    : 0;

  // Filter list
  const filteredPlayers = (rosterTab === 'roster' ? userPlayers : freeAgents).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesPos = posFilter === 'ALL' || p.position === posFilter;
    return matchesSearch && matchesPos;
  });

  // Check if positions are missing in starters
  const requiredPositions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const missingPositions = requiredPositions.filter(
    (pos) => !starters.some((p) => p.position === pos)
  );

  return (
    <div className="space-y-6" id="roster-manager-tab">
      {/* Team Summary Cards */}
      {rosterTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Ratings Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                Csapat Játékerő & Taktikai Értékek
              </h2>
              <div className="space-y-4">
                {/* Overall */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Csapat Átlag (OVR)</span>
                    <span className="text-2xl font-black font-mono text-white">{teamOvr}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${teamOvr}%` }} />
                  </div>
                </div>

                {/* Offense */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Támadóerő (OFF)</span>
                    <span className="text-xl font-bold font-mono text-orange-400">{teamOffense}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${teamOffense}%` }} />
                  </div>
                </div>

                {/* Defense */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Védőerő (DEF)</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{teamDefense}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${teamDefense}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Position Alerts */}
            {missingPositions.length > 0 && starters.length > 0 && (
              <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                ⚠️ <span className="font-bold">Hiányzó posztok a kezdőben:</span>{' '}
                {missingPositions.join(', ')}. Ez rontja a meccsek szimulációs hatékonyságát!
              </div>
            )}
            {starters.length === 0 && (
              <div className="mt-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-400 font-bold">
                🚨 Nincs aktív kezdőötösöd! Jelölj ki játékosokat a kezdőbe a meccs indítása előtt.
              </div>
            )}
          </div>

          {/* Interactive Court Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:col-span-2 shadow-md">
            <CourtView starters={starters} onPlayerClick={(p) => onToggleStarter(p.id)} seasonMvpId={seasonMvpId} />
          </div>
        </div>
      )}

      {/* Roster & Free Agent Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 w-fit">
            <button
              onClick={() => { setRosterTab('roster'); setSearch(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                rosterTab === 'roster'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Saját Keret ({userPlayers.length})
            </button>
            <button
              onClick={() => { setRosterTab('free_agents'); setSearch(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                rosterTab === 'free_agents'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Szabadügynökök ({freeAgents.length})
            </button>
          </div>

          {onNavigateToMarket && (
            <button
              onClick={onNavigateToMarket}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/10 transition-all cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
              <span>Játékos Vásárlás (Piac)</span>
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Position Selector */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 items-center gap-1 text-xs">
            <span className="text-slate-500 font-bold px-1 uppercase text-[10px]">Poszt:</span>
            {['ALL', 'PG', 'SG', 'SF', 'PF', 'C'].map((pos) => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos as any)}
                className={`px-2 py-1 rounded-md font-bold text-[10px] cursor-pointer transition-colors ${
                  posFilter === pos
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Játékos keresése..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 w-48"
            />
          </div>
        </div>
      </div>

      {/* Players Grid Display */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => {
            const isUserTeam = player.teamId === 'user_team';
            
            return (
              <PlayerCard
                key={player.id}
                player={player}
                isMvp={seasonMvpId === player.id}
                onToggleStarter={isUserTeam ? () => onToggleStarter(player.id) : undefined}
                onAction={
                  isUserTeam
                    ? () => onReleasePlayer(player.id)
                    : () => onSignPlayer(player.id)
                }
                actionLabel={isUserTeam ? 'Elengedés' : 'Szerződtetés'}
                actionIcon={
                  isUserTeam ? (
                    <UserMinus className="h-3.5 w-3.5" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5 text-slate-950" />
                  )
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400 text-sm">
          📭 Nem találtunk a keresésnek megfelelő játékost. Próbáld megváltoztatni a szűrőket!
        </div>
      )}
    </div>
  );
}
