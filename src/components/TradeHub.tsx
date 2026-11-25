import React, { useState, useEffect } from 'react';
import { Team, Player, TradeOffer } from '../types';
import { getPositionBadgeColor } from './PlayerCard';
import { calculateBuyoutPrice, formatMillions } from '../utils/transferMarket';
import { ArrowLeftRight, Check, X, MessageSquare, AlertCircle, Sparkles, Coins, ShoppingBag, Trophy } from 'lucide-react';

interface TradeHubProps {
  teams: Team[];
  players: Player[];
  activeOffers: TradeOffer[];
  onAcceptOffer: (offerId: string) => void;
  onDeclineOffer: (offerId: string) => void;
  onProposeTrade: (
    senderTeamId: string,
    receiverTeamId: string,
    senderPlayerIds: string[],
    receiverPlayerIds: string[]
  ) => { success: boolean; message: string; aiResponse?: string };
  salaryCap: number;
  onBuyPlayer?: (playerId: string, buyoutPrice: number, bypassCap?: boolean) => { success: boolean; message: string };
  onNavigateToMarket?: () => void;
  seasonMvpId?: string | null;
}

export default function TradeHub({
  teams,
  players,
  activeOffers,
  onAcceptOffer,
  onDeclineOffer,
  onProposeTrade,
  salaryCap,
  onBuyPlayer,
  onNavigateToMarket,
  seasonMvpId
}: TradeHubProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [userSelectedPlayers, setUserSelectedPlayers] = useState<string[]>([]);
  const [targetSelectedPlayers, setTargetSelectedPlayers] = useState<string[]>([]);
  const [negotiationResult, setNegotiationResult] = useState<{
    status: 'idle' | 'success' | 'declined' | 'loading';
    message: string;
  }>({ status: 'idle', message: '' });

  const userTeam = teams.find(t => t.isUser)!;
  const computerTeams = teams.filter(t => !t.isUser);
  const selectedTargetTeam = teams.find(t => t.id === selectedTeamId);

  const myPlayers = players.filter(p => p.teamId === userTeam.id);
  const targetPlayers = players.filter(p => p.teamId === selectedTeamId);

  // Clear selections when switching teams
  useEffect(() => {
    setTargetSelectedPlayers([]);
    setNegotiationResult({ status: 'idle', message: '' });
  }, [selectedTeamId]);

  const handleToggleMyPlayer = (playerId: string) => {
    setUserSelectedPlayers(prev => 
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const handleToggleTargetPlayer = (playerId: string) => {
    setTargetSelectedPlayers(prev => 
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  // Calculate sum of salaries for financial balance check
  const myTradedSalary = players
    .filter(p => userSelectedPlayers.includes(p.id))
    .reduce((acc, p) => acc + p.salary, 0);

  const targetTradedSalary = players
    .filter(p => targetSelectedPlayers.includes(p.id))
    .reduce((acc, p) => acc + p.salary, 0);

  // Rule: Trade must be financially valid if user team goes over salary cap
  const myTotalSalary = players.filter(p => p.teamId === userTeam.id).reduce((acc, p) => acc + p.salary, 0);
  const salaryDiff = targetTradedSalary - myTradedSalary;
  const hypotheticalNewPayroll = myTotalSalary + salaryDiff;
  const isSalaryInvalid = hypotheticalNewPayroll > salaryCap && salaryDiff > 0;

  const handlePropose = async () => {
    if (userSelectedPlayers.length === 0 || targetSelectedPlayers.length === 0) {
      setNegotiationResult({
        status: 'declined',
        message: 'Mindkét oldalon ki kell választanod legalább egy játékost a csere indításához!'
      });
      return;
    }

    if (isSalaryInvalid) {
      setNegotiationResult({
        status: 'declined',
        message: `Pénzügyi szabály megszegve! A fizetési sapkát ($${salaryCap}M) túllépnéd ezzel a cserével (új bértömeg: $${hypotheticalNewPayroll.toFixed(1)}M). Biztosíts kiegyensúlyozottabb fizetéseket!`
      });
      return;
    }

    setNegotiationResult({ status: 'loading', message: 'Tárgyalás folyamatban a Vezérigazgatóval...' });

    // Call propose handler
    setTimeout(() => {
      const result = onProposeTrade(
        userTeam.id,
        selectedTeamId,
        userSelectedPlayers,
        targetSelectedPlayers
      );

      if (result.success) {
        setNegotiationResult({
          status: 'success',
          message: result.aiResponse || result.message
        });
        // Clear selections
        setUserSelectedPlayers([]);
        setTargetSelectedPlayers([]);
      } else {
        setNegotiationResult({
          status: 'declined',
          message: result.aiResponse || result.message
        });
      }
    }, 1200);
  };

  return (
    <div className="space-y-6" id="trade-hub-tab">
      {onNavigateToMarket && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">Játékost szeretnél vásárolni csere nélkül?</p>
              <p className="text-[11px] text-slate-400">A Játékos Vásárlási Piacon bármelyik NBA sztárt és szabadügynököt azonnal megveheted készpénzért!</p>
            </div>
          </div>
          <button
            onClick={onNavigateToMarket}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
          >
            Játékos Vásárlás Piac Megnyitása
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER PANEL: CSINÁLJ EGY CSERÉT (Construct a trade) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-amber-500" />
                Csere Tárgyalóterem
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Állíts össze egy csereajánlatot és nyújtsd be az ellenfél csapatának.</p>
            </div>
            
            {/* Target Team Selector */}
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-700 cursor-pointer"
            >
              <option value="">Válassz ellenfelet...</option>
              {computerTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.city} {t.name} (GM: {t.gmName})
                </option>
              ))}
            </select>
          </div>

          {selectedTeamId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              
              {/* SENDER COLUMN: Te adod (User Team) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div>
                    <p className="text-xs font-bold text-slate-100">{userTeam.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Te adod</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-amber-500">${myTradedSalary.toFixed(1)}M</p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Össz. Bértömeg</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {myPlayers.map(p => {
                    const isSelected = userSelectedPlayers.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleToggleMyPlayer(p.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/30 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${getPositionBadgeColor(p.position)}`}>
                            {p.position}
                          </span>
                          <div>
                            <p className="text-xs font-bold flex items-center gap-1">
                              {seasonMvpId === p.id && <Trophy className="h-3.5 w-3.5 text-amber-400 fill-amber-400/25 shrink-0" />}
                              <span>{p.name}</span>
                            </p>
                            <p className="text-[10px] text-slate-400">OVR: {p.ovr} • ${p.salary.toFixed(1)}M</p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RECEIVER COLUMN: Te kapod (Target Computer Team) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div>
                    <p className="text-xs font-bold text-slate-100">{selectedTargetTeam?.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Te kapod</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-emerald-400">${targetTradedSalary.toFixed(1)}M</p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Össz. Bértömeg</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {targetPlayers.map(p => {
                    const isSelected = targetSelectedPlayers.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleToggleTargetPlayer(p.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${getPositionBadgeColor(p.position)}`}>
                            {p.position}
                          </span>
                          <div>
                            <p className="text-xs font-bold flex items-center gap-1">
                              {seasonMvpId === p.id && <Trophy className="h-3.5 w-3.5 text-amber-400 fill-amber-400/25 shrink-0" />}
                              <span>{p.name}</span>
                            </p>
                            <p className="text-[10px] text-slate-400">OVR: {p.ovr} • ${p.salary.toFixed(1)}M</p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PROPOSE ACTION BAR */}
              <div className="md:col-span-2 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-slate-500" />
                  Bérkülönbség:{' '}
                  <span className={`font-bold font-mono ${salaryDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {salaryDiff > 0 ? `+$${salaryDiff.toFixed(1)}M` : `-$${Math.abs(salaryDiff).toFixed(1)}M`}
                  </span>
                  {isSalaryInvalid && (
                    <span className="text-rose-500 font-bold flex items-center gap-0.5 ml-2 animate-pulse">
                      <AlertCircle className="h-3.5 w-3.5" /> (Túllépi a sapkát!)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {targetSelectedPlayers.length === 1 && userSelectedPlayers.length === 0 && onBuyPlayer && (
                    <button
                      onClick={() => {
                        const targetP = players.find(p => p.id === targetSelectedPlayers[0]);
                        if (!targetP) return;
                        const price = calculateBuyoutPrice(targetP);
                        const res = onBuyPlayer(targetP.id, price);
                        setNegotiationResult({
                          status: res.success ? 'success' : 'declined',
                          message: res.message
                        });
                        if (res.success) {
                          setTargetSelectedPlayers([]);
                        }
                      }}
                      className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Coins className="h-4 w-4" />
                      <span>Közvetlen Kivásárlás ({formatMillions(calculateBuyoutPrice(players.find(p => p.id === targetSelectedPlayers[0])!))})</span>
                    </button>
                  )}

                  <button
                    onClick={handlePropose}
                    disabled={negotiationResult.status === 'loading' || isSalaryInvalid}
                    className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Ajánlat Benyújtása
                  </button>
                </div>
              </div>

              {/* NEGOTIATION SCREEN (GM RESPONSE CONTAINER) */}
              {negotiationResult.status !== 'idle' && (
                <div className="md:col-span-2 mt-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex gap-4 animate-fadeIn">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-200 uppercase flex-shrink-0">
                    {selectedTargetTeam?.gmName.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-300">
                      {selectedTargetTeam?.gmName} <span className="text-slate-500 font-normal">({selectedTargetTeam?.city} GM, {selectedTargetTeam?.gmPersonality} személyiség)</span>
                    </p>
                    {negotiationResult.status === 'loading' ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-bounce" />
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span>A menedzser fontolóra veszi a feltételeket...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 relative">
                        <MessageSquare className="absolute right-3 top-3 h-4 w-4 text-slate-700" />
                        "{negotiationResult.message}"
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-sm">
              🤝 Kezdéshez válassz egy ellenfél csapatot a fenti menüből!
            </div>
          )}
        </div>

        {/* RIGHT PANEL: BEÉRKEZŐ CSEREAJÁNLATOK (Incoming offers) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              Beérkező Ajánlatok
            </h2>
            
            <div className="space-y-4 mt-4 overflow-y-auto max-h-[480px]">
              {activeOffers.length > 0 ? (
                activeOffers.map((offer) => {
                  const offerTeam = teams.find(t => t.id === offer.senderTeamId);
                  const senderPlayers = players.filter(p => offer.senderPlayerIds.includes(p.id));
                  const receiverPlayers = players.filter(p => offer.receiverPlayerIds.includes(p.id));

                  return (
                    <div key={offer.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-500 text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase">
                        Új ajánlat!
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                          {offerTeam?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{offerTeam?.city} {offerTeam?.name}</p>
                          <p className="text-[9px] text-slate-500 uppercase font-semibold">GM: {offerTeam?.gmName}</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-300 italic bg-slate-900 border border-slate-850 p-2 rounded">
                        "{offer.message}"
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-800 pt-2">
                        <div>
                          <p className="text-slate-500 uppercase font-bold">Kapod tőlük:</p>
                          <ul className="list-disc pl-3 text-emerald-400 font-semibold space-y-0.5 mt-1">
                            {senderPlayers.map(p => (
                              <li key={p.id} className="truncate flex items-center gap-1">
                                {seasonMvpId === p.id && <Trophy className="h-3 w-3 text-amber-400 shrink-0" />}
                                <span className="truncate">{p.name} (OVR: {p.ovr})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase font-bold">Kérik tőled:</p>
                          <ul className="list-disc pl-3 text-amber-500 font-semibold space-y-0.5 mt-1">
                            {receiverPlayers.map(p => (
                              <li key={p.id} className="truncate flex items-center gap-1">
                                {seasonMvpId === p.id && <Trophy className="h-3 w-3 text-amber-400 shrink-0" />}
                                <span className="truncate">{p.name} (OVR: {p.ovr})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => onDeclineOffer(offer.id)}
                          className="flex-1 border border-rose-500/30 hover:border-rose-500 bg-rose-500/10 text-rose-400 hover:text-white text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          <X className="h-3 w-3" /> Elutasít
                        </button>
                        <button
                          onClick={() => onAcceptOffer(offer.id)}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 hover:text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          <Check className="h-3 w-3" /> Elfogad
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-950/30 border border-slate-850 rounded-xl p-8 text-center text-slate-500 text-xs">
                  📭 Jelenleg nincsenek beérkező csereajánlatok. Más csapatok a mérkőzések után küldhetnek új megkereséseket!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
