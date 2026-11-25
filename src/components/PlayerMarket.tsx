import React, { useState, useMemo } from 'react';
import { Player, Team, Position } from '../types';
import { calculateBuyoutPrice, formatMillions } from '../utils/transferMarket';
import { getPositionBadgeColor } from './PlayerCard';
import { 
  ShoppingBag, 
  Search, 
  Coins, 
  Sparkles, 
  DollarSign, 
  Check, 
  AlertTriangle, 
  PlusCircle, 
  ArrowRight,
  Shield,
  Star,
  X,
  Filter,
  Users,
  Trophy
} from 'lucide-react';

interface PlayerMarketProps {
  players: Player[];
  teams: Team[];
  userTeam: Team;
  onBuyPlayer: (playerId: string, buyoutPrice: number, bypassCap?: boolean) => { success: boolean; message: string };
  onAddFunds: (amount: number) => void;
  salaryCap: number;
  totalPayroll: number;
  onNavigateToRoster: () => void;
  seasonMvpId?: string | null;
}

export default function PlayerMarket({
  players,
  teams,
  userTeam,
  onBuyPlayer,
  onAddFunds,
  salaryCap,
  totalPayroll,
  onNavigateToRoster,
  seasonMvpId
}: PlayerMarketProps) {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'free_agents' | 'stars' | 'hungarian'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'ovr_desc' | 'price_asc' | 'price_desc' | 'salary_asc' | 'name_asc'>('ovr_desc');
  
  // Selected player for purchase modal
  const [confirmingPlayer, setConfirmingPlayer] = useState<Player | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cashBudget = userTeam.cashBudget ?? 65;
  const remainingCap = salaryCap - totalPayroll;

  // Hungarian player IDs
  const hungarianIds = ['hanga', 'david_kornel', 'valerio_bodon', 'somogyi_adam'];

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      // Name search
      const matchesSearch = player.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // Position filter
      if (posFilter !== 'ALL' && player.position !== posFilter) return false;

      // Team filter
      if (teamFilter !== 'ALL') {
        if (teamFilter === 'free_agent' && player.teamId !== 'free_agent') return false;
        if (teamFilter !== 'free_agent' && player.teamId !== teamFilter) return false;
      }

      // Category filter
      if (categoryFilter === 'free_agents' && player.teamId !== 'free_agent') return false;
      if (categoryFilter === 'stars' && (player.teamId === 'free_agent' || player.teamId === 'user_team')) return false;
      if (categoryFilter === 'hungarian' && !hungarianIds.includes(player.id)) return false;

      return true;
    }).sort((a, b) => {
      const priceA = calculateBuyoutPrice(a);
      const priceB = calculateBuyoutPrice(b);

      switch (sortBy) {
        case 'ovr_desc':
          return b.ovr - a.ovr;
        case 'price_asc':
          return priceA - priceB;
        case 'price_desc':
          return priceB - priceA;
        case 'salary_asc':
          return a.salary - b.salary;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        default:
          return b.ovr - a.ovr;
      }
    });
  }, [players, search, posFilter, teamFilter, categoryFilter, sortBy]);

  const handlePurchaseConfirm = (bypassCap = false) => {
    if (!confirmingPlayer) return;

    const price = calculateBuyoutPrice(confirmingPlayer);
    const result = onBuyPlayer(confirmingPlayer.id, price, bypassCap);

    if (result.success) {
      setNotification({ type: 'success', text: result.message });
      setConfirmingPlayer(null);
    } else {
      setNotification({ type: 'error', text: result.message });
    }

    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  return (
    <div className="space-y-6" id="player-market-container">
      {/* Top Banner & Financial Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash Funds (Klubkassza) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Elérhető Klubkassza</p>
                <p className="text-2xl font-black font-mono text-amber-400">{formatMillions(cashBudget)}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onAddFunds(25);
                setNotification({ type: 'success', text: '+$25.0M Szponzori tőke hozzáadva a kasszához! Most már bármelyik sztárt megveheted!' });
                setTimeout(() => setNotification(null), 3000);
              }}
              className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
              title="Kattints ide további tőke hozzáadásához"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+25M Tőke</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
            💡 Ebből a pénzből vásárolhatsz meg bármilyen NBA játékost a csapatodba!
          </p>
        </div>

        {/* Salary Cap (Fizetési Sapka) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fizetési Sapka Keret</p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl font-black font-mono ${remainingCap < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                    ${totalPayroll.toFixed(1)}M
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ ${salaryCap}M</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
                remainingCap < 0 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {remainingCap < 0 ? `Túllépve: ${Math.abs(remainingCap).toFixed(1)}M` : `Szabad: ${remainingCap.toFixed(1)}M`}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${remainingCap < 0 ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(100, (totalPayroll / salaryCap) * 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Guide / Help */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Hogyan működik a vásárlás?</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                <span className="text-emerald-400 font-semibold">Szabadügynökök:</span> Átigazolási díj nélkül ($0M) ingyen szerződtethetők!<br />
                <span className="text-amber-400 font-semibold">Sztárok:</span> Kivásárlási ár kifizetésével azonnal átigazolnak hozzád!
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToRoster}
            className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 self-end transition-colors"
          >
            <span>Saját keret megtekintése</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications bar */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-rose-400" />}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/5 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 gap-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Minden Játékos ({players.length})
            </button>
            <button
              onClick={() => setCategoryFilter('free_agents')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'free_agents'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Ingyenes Szabadügynökök
            </button>
            <button
              onClick={() => setCategoryFilter('stars')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'stars'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="h-3 w-3 text-amber-400 fill-current" />
              NBA Sztárok (Kivásárlás)
            </button>
            <button
              onClick={() => setCategoryFilter('hungarian')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'hungarian'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇭🇺 Magyar Játékosok
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Keresés név szerint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Secondary Filters: Position, Team & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Positions */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Poszt:</span>
            {['ALL', 'PG', 'SG', 'SF', 'PF', 'C'].map((pos) => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos as any)}
                className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                  posFilter === pos
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Team Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Csapat:</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Minden csapat</option>
              <option value="free_agent">Szabadügynökök</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isUser ? '(Te)' : ''}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-2">Rendezés:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ovr_desc">OVR játékerő (Legjobb)</option>
              <option value="price_asc">Vételár: Legolcsóbb</option>
              <option value="price_desc">Vételár: Legdrágább</option>
              <option value="salary_asc">Fizetés: Legalacsonyabb</option>
              <option value="name_asc">Név szerint (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players List Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPlayers.map((player) => {
            const isUserPlayer = player.teamId === 'user_team';
            const isFreeAgent = player.teamId === 'free_agent';
            const playerTeam = teams.find(t => t.id === player.teamId);
            const buyoutPrice = calculateBuyoutPrice(player);
            const canAffordCash = cashBudget >= buyoutPrice;
            const willExceedCap = totalPayroll + player.salary > salaryCap;

            return (
              <div
                key={player.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl ${
                  isUserPlayer 
                    ? 'border-emerald-500/40 bg-emerald-950/10' 
                    : player.ovr >= 90 
                      ? 'border-amber-500/30 hover:border-amber-500/60' 
                      : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Header: Team tag & OVR */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getPositionBadgeColor(player.position)} uppercase`}>
                          {player.position}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                          {isFreeAgent ? '🆓 Szabadügynök' : isUserPlayer ? '👑 Saját csapatod' : playerTeam?.name}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight mt-1 flex items-center gap-1.5">
                        {seasonMvpId === player.id && (
                          <span title="Szezon MVP (PPG + RPG + APG)" className="inline-flex items-center shrink-0">
                            <Trophy className="h-4 w-4 text-amber-400 fill-amber-400/25 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                          </span>
                        )}
                        <span className="truncate">{player.name}</span>
                      </h3>
                    </div>

                    <div className={`h-10 w-10 rounded-xl flex flex-col items-center justify-center font-bold font-mono ${
                      player.ovr >= 90
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : player.ovr >= 82
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white'
                          : 'bg-slate-800 text-slate-300'
                    }`}>
                      <span className="text-[9px] text-opacity-80 -mb-1">OVR</span>
                      <span className="text-base leading-tight">{player.ovr}</span>
                    </div>
                  </div>

                  {/* Attributes Badges */}
                  <div className="bg-slate-950/60 rounded-xl p-2.5 mb-3 grid grid-cols-5 gap-1 text-center border border-slate-800/60">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">3PT</p>
                      <p className="text-xs font-bold text-slate-200">{player.shooting3pt}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">BENT</p>
                      <p className="text-xs font-bold text-slate-200">{player.pointsInside}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">PÁSZ</p>
                      <p className="text-xs font-bold text-slate-200">{player.playmaking}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">LEP</p>
                      <p className="text-xs font-bold text-slate-200">{player.rebounding}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">VÉD</p>
                      <p className="text-xs font-bold text-slate-200">{player.defense}</p>
                    </div>
                  </div>

                  {/* Financial Details (Buyout price & Annual salary) */}
                  <div className="bg-slate-950/40 rounded-xl p-2.5 mb-4 border border-slate-800/50 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Vételár / Átigazolási díj:</span>
                      {isFreeAgent ? (
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                          INGYENES ($0M)
                        </span>
                      ) : (
                        <span className="font-bold font-mono text-amber-400">
                          {formatMillions(buyoutPrice)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Éves Fizetés:</span>
                      <span className="font-medium text-slate-200 font-mono">${player.salary.toFixed(1)}M / év</span>
                    </div>
                  </div>
                </div>

                {/* Purchase / Action Button */}
                {isUserPlayer ? (
                  <div className="w-full py-2 px-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                    <Check className="h-4 w-4" />
                    <span>Már a te csapatodban van</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingPlayer(player)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-md ${
                      isFreeAgent
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950'
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
                    <span>
                      {isFreeAgent ? 'Ingyenes Szerződtetés' : `Megvásárlás (${formatMillions(buyoutPrice)})`}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Nem található játékos a megadott szűrők alapján.</p>
          <p className="text-xs text-slate-500 mt-1">Próbáld meg törölni a keresést vagy módosítani a kategóriát!</p>
        </div>
      )}

      {/* Confirmation & Checkout Modal */}
      {confirmingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Játékos Megvásárlása és Átigazolás</h3>
                  <p className="text-xs text-slate-400">Erősítsd meg a szerződést!</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmingPlayer(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Player Summary Card */}
              <div className="flex items-center justify-between p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-amber-500 text-slate-950 font-mono font-bold flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase -mb-1">OVR</span>
                    <span className="text-lg leading-tight">{confirmingPlayer.ovr}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPositionBadgeColor(confirmingPlayer.position)}`}>
                        {confirmingPlayer.position}
                      </span>
                      <span className="text-xs text-slate-400">
                        {confirmingPlayer.teamId === 'free_agent' ? 'Szabadügynök' : teams.find(t => t.id === confirmingPlayer.teamId)?.name}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5">
                      {seasonMvpId === confirmingPlayer.id && (
                        <span title="Szezon MVP (PPG + RPG + APG)" className="inline-flex items-center shrink-0">
                          <Trophy className="h-4 w-4 text-amber-400 fill-amber-400/25" />
                        </span>
                      )}
                      <span>{confirmingPlayer.name}</span>
                    </h4>
                  </div>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-3 text-xs">
                <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Pénzügyi Tranzakció Részletei</p>
                
                {/* Buyout price */}
                <div className="flex justify-between items-center text-slate-300">
                  <span>Átigazolási / Kivásárlási díj:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {confirmingPlayer.teamId === 'free_agent' ? 'INGYENES ($0.0M)' : formatMillions(calculateBuyoutPrice(confirmingPlayer))}
                  </span>
                </div>

                {/* Cash balance check */}
                <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/60 pt-2">
                  <span>Jelenlegi klubkassza egyenleg:</span>
                  <span className="font-mono font-bold text-slate-200">{formatMillions(cashBudget)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Klubkassza a vásárlás után:</span>
                  <span className={`font-mono font-bold ${cashBudget - calculateBuyoutPrice(confirmingPlayer) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatMillions(cashBudget - calculateBuyoutPrice(confirmingPlayer))}
                  </span>
                </div>

                {/* Salary Cap check */}
                <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/60 pt-2">
                  <span>Játékos éves bére:</span>
                  <span className="font-mono font-bold text-slate-200">${confirmingPlayer.salary.toFixed(1)}M / év</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Új bértömeg a fizetési sapkához:</span>
                  <span className={`font-mono font-bold ${totalPayroll + confirmingPlayer.salary > salaryCap ? 'text-rose-400' : 'text-slate-200'}`}>
                    ${(totalPayroll + confirmingPlayer.salary).toFixed(1)}M / ${salaryCap}M
                  </span>
                </div>
              </div>

              {/* Status Checks & Warnings */}
              {cashBudget < calculateBuyoutPrice(confirmingPlayer) && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Nincs elég pénz a klubkasszában!</span> Szükséged van még{' '}
                    {formatMillions(calculateBuyoutPrice(confirmingPlayer) - cashBudget)} tőkére.
                    <button 
                      onClick={() => onAddFunds(25)}
                      className="block mt-1 font-bold text-amber-400 underline hover:text-amber-300"
                    >
                      Kattints ide +25M szponzori támogatás felvételéhez!
                    </button>
                  </div>
                </div>
              )}

              {totalPayroll + confirmingPlayer.salary > salaryCap && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Figyelem: A fizetés átlépi a sapkát!</span> Az éves fizetés miatt túlléped a ${salaryCap}M-s sapkát. Engedélyezheted a vásárlást luxusadóval, vagy engedj el valakit a keretből.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmingPlayer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Mégsem
              </button>

              {cashBudget >= calculateBuyoutPrice(confirmingPlayer) && (
                <>
                  {totalPayroll + confirmingPlayer.salary <= salaryCap ? (
                    <button
                      onClick={() => handlePurchaseConfirm(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Megvásárlás & Igazolás</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchaseConfirm(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Kivásárlás Luxusadóval (Sapka Felett)</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
