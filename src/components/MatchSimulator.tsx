import React, { useState, useEffect, useRef } from 'react';
import { Team, Player, LiveMatchState, LiveMatchPlayerStats } from '../types';
import { simulatePossession, initMatchStats } from '../utils/gameEngine';
import { Play, Pause, FastForward, SkipForward, Award, ListFilter, Users, Zap, AlertTriangle } from 'lucide-react';

interface MatchSimulatorProps {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  players: Player[];
  onFinishMatch: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    homeStats: Record<string, LiveMatchPlayerStats>,
    awayStats: Record<string, LiveMatchPlayerStats>
  ) => void;
}

export default function MatchSimulator({
  matchId,
  homeTeam,
  awayTeam,
  players,
  onFinishMatch
}: MatchSimulatorProps) {
  const [matchState, setMatchState] = useState<LiveMatchState | null>(null);
  const [offenseStyle, setOffenseStyle] = useState<'fast' | 'slow' | 'three'>('slow');
  const [defenseStyle, setDefenseStyle] = useState<'man' | 'zone' | 'press'>('man');
  const [selectedStarterId, setSelectedStarterId] = useState<string>('');
  const [selectedBenchId, setSelectedBenchId] = useState<string>('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickerBottomRef = useRef<HTMLDivElement | null>(null);

  const homePlayers = players.filter((p) => p.teamId === homeTeam.id);
  const awayPlayers = players.filter((p) => p.teamId === awayTeam.id);

  // Setup initial match state
  useEffect(() => {
    const homeStarters = homePlayers.filter(p => p.isStarter);
    const awayStarters = awayPlayers.filter(p => p.isStarter);

    // Fallback: make sure we have exactly 5 starters
    const getCleanStarters = (teamPlayers: Player[]) => {
      const activeStarters = teamPlayers.filter(p => p.isStarter);
      if (activeStarters.length >= 5) return activeStarters.slice(0, 5);
      const sorted = [...teamPlayers].sort((a, b) => b.ovr - a.ovr);
      return sorted.slice(0, 5);
    };

    const cleanHome = getCleanStarters(homePlayers);
    const cleanAway = getCleanStarters(awayPlayers);

    setMatchState({
      matchId,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeScore: 0,
      awayScore: 0,
      quarter: 1,
      timeRemaining: 180, // 180 seconds condensed quarter
      ticker: ['🎉 Feldobás! Elkezdődik a mérkőzés! Hajrá kosárlabda!'],
      isLive: true,
      isPaused: true,
      speed: 1,
      homeStats: initMatchStats(homePlayers),
      awayStats: initMatchStats(awayPlayers),
      possession: Math.random() < 0.5 ? 'home' : 'away',
      lastPlayTime: Date.now()
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [matchId]);

  // Scroll ticker to bottom on update
  useEffect(() => {
    if (tickerBottomRef.current) {
      tickerBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [matchState?.ticker]);

  // Main game loop ticker
  useEffect(() => {
    if (!matchState || !matchState.isLive || matchState.isPaused || matchState.speed === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const playDelay = 1500 / matchState.speed;

    intervalRef.current = setInterval(() => {
      setMatchState((prev) => {
        if (!prev) return null;

        const homeStarters = homePlayers.filter(p => p.isStarter);
        const awayStarters = awayPlayers.filter(p => p.isStarter);

        // Standard safety: make sure we have 5 players
        const getStartersSafe = (list: Player[]) => {
          const s = list.filter(p => p.isStarter);
          return s.length >= 5 ? s.slice(0, 5) : list.slice(0, 5);
        };

        const activeHome = getStartersSafe(homePlayers);
        const activeAway = getStartersSafe(awayPlayers);

        const attackingPlayers = prev.possession === 'home' ? activeHome : activeAway;
        const defendingPlayers = prev.possession === 'home' ? activeAway : activeHome;

        const isHomeAttacking = prev.possession === 'home';
        const attackingTeamId = isHomeAttacking ? prev.homeTeamId : prev.awayTeamId;

        // Simulate possession play
        const result = simulatePossession(
          attackingTeamId,
          attackingPlayers,
          defendingPlayers,
          prev.homeStats,
          prev.awayStats,
          isHomeAttacking,
          { offenseStyle, defenseStyle }
        );

        // Update score
        let newHomeScore = prev.homeScore;
        let newAwayScore = prev.awayScore;
        if (isHomeAttacking) {
          newHomeScore += result.scoreChange;
        } else {
          newAwayScore += result.scoreChange;
        }

        // Time ticks down
        const possessionTimeUsed = Math.floor(Math.random() * 8) + 12; // 12-20s shot clock turn
        let newTimeRemaining = prev.timeRemaining - possessionTimeUsed;
        let newQuarter = prev.quarter;
        let newTicker = [...prev.ticker, `[N:${newQuarter} - ${formatTime(Math.max(0, newTimeRemaining))}] ${result.commentary}`];

        // Ensure ticker is kept at manageable length
        if (newTicker.length > 30) newTicker.shift();

        let isMatchFinished = false;
        let nextPossession = result.possessionSwaps 
          ? (prev.possession === 'home' ? 'away' : 'home') 
          : prev.possession;

        if (newTimeRemaining <= 0) {
          if (newQuarter < 4) {
            newQuarter += 1;
            newTimeRemaining = 180;
            newTicker.push(`🔔 Vége a(z) ${newQuarter - 1}. negyednek! Jön a következő felvonás.`);
            nextPossession = Math.random() < 0.5 ? 'home' : 'away';
          } else {
            // Overtime safeguard if tied
            if (newHomeScore === newAwayScore) {
              newTimeRemaining = 60; // 1 minute overtime
              newTicker.push(`🚨 DÖNTETLEN! Hosszabbítás következik!`);
            } else {
              // Game Finished!
              isMatchFinished = true;
              newTimeRemaining = 0;
              newTicker.push(`🏁 Vége a mérkőzésnek! Végeredmény: ${newHomeScore} - ${newAwayScore}`);
            }
          }
        }

        if (isMatchFinished) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Delayed finish callback
          setTimeout(() => {
            onFinishMatch(prev.matchId, newHomeScore, newAwayScore, prev.homeStats, prev.awayStats);
          }, 1500);

          return {
            ...prev,
            homeScore: newHomeScore,
            awayScore: newAwayScore,
            quarter: newQuarter,
            timeRemaining: newTimeRemaining,
            ticker: newTicker,
            isLive: false,
            possession: nextPossession as 'home' | 'away'
          };
        }

        return {
          ...prev,
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          quarter: newQuarter,
          timeRemaining: newTimeRemaining,
          ticker: newTicker,
          possession: nextPossession as 'home' | 'away',
          lastPlayTime: Date.now()
        };
      });
    }, playDelay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [matchState?.isPaused, matchState?.speed, matchState?.isLive, offenseStyle, defenseStyle]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!matchState) return null;

  // Substitution Action
  const handlePerformSubstitution = (starterId: string, benchId: string) => {
    if (!starterId || !benchId) return;

    // Swap starting status in React state triggers
    // In our parent app, we mutate or update players data.
    // For local match consistency, we also swap inside stats and current rosters
    const starterPlayer = players.find(p => p.id === starterId);
    const benchPlayer = players.find(p => p.id === benchId);
    
    if (starterPlayer && benchPlayer) {
      starterPlayer.isStarter = false;
      benchPlayer.isStarter = true;
      // Alert ticker
      setMatchState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ticker: [...prev.ticker, `🔄 CSERE: ${benchPlayer.name} lép pályára ${starterPlayer.name} helyett!`]
        };
      });
      setSelectedStarterId('');
      setSelectedBenchId('');
    }
  };

  // Instant Simulate full remaining game
  const handleInstantSimulate = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Auto simulate score boosts to represent remaining game
    const remainingQuarters = 4 - matchState.quarter;
    const remainingTimeRatio = (matchState.timeRemaining / 180) + remainingQuarters;
    
    const extraHomePoints = Math.round((Math.random() * 20 + 40) * remainingTimeRatio);
    const extraAwayPoints = Math.round((Math.random() * 20 + 40) * remainingTimeRatio);
    
    const finalHome = matchState.homeScore + extraHomePoints;
    const finalAway = matchState.awayScore + extraAwayPoints;
    
    // Randomize player stats slightly to represent played stats
    const applyStatsBoost = (stats: Record<string, LiveMatchPlayerStats>) => {
      Object.keys(stats).forEach(id => {
        const active = players.find(p => p.id === id);
        if (active?.isStarter) {
          stats[id].points += Math.round(Math.random() * 12 + 6);
          stats[id].rebounds += Math.round(Math.random() * 5 + 2);
          stats[id].assists += Math.round(Math.random() * 4 + 1);
        }
      });
    };

    applyStatsBoost(matchState.homeStats);
    applyStatsBoost(matchState.awayStats);

    onFinishMatch(matchState.matchId, finalHome, finalAway, matchState.homeStats, matchState.awayStats);
  };

  const currentMatchScheduleLabel = `${homeTeam.name} - ${awayTeam.name}`;

  return (
    <div className="space-y-6" id="match-simulator-panel">
      
      {/* SCOREBOARD HEADER */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 h-24 w-48 bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 h-24 w-48 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="grid grid-cols-3 items-center text-center gap-4">
          {/* Home Team */}
          <div className="flex flex-col items-center">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-tr ${homeTeam.color} flex items-center justify-center font-bold text-2xl text-white shadow-md`}>
              {homeTeam.name.charAt(0)}
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-2 tracking-tight truncate max-w-[150px]">
              {homeTeam.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Hazai</p>
          </div>

          {/* Scores & Quarter */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1 text-xs text-amber-500 font-mono font-black uppercase tracking-wider">
              {matchState.quarter}. Negyed
            </div>

            <div className="flex items-center gap-6">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tighter">
                {matchState.homeScore}
              </span>
              <span className="text-2xl font-bold text-slate-600">:</span>
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tighter">
                {matchState.awayScore}
              </span>
            </div>

            <div className="text-lg font-mono font-bold text-slate-400">
              {formatTime(matchState.timeRemaining)}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-tr ${awayTeam.color} flex items-center justify-center font-bold text-2xl text-white shadow-md`}>
              {awayTeam.name.charAt(0)}
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-2 tracking-tight truncate max-w-[150px]">
              {awayTeam.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Vendég</p>
          </div>
        </div>
      </div>

      {/* TACTICS & SUBS CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TACTICS BOX */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <ListFilter className="h-4 w-4 text-amber-500" />
            Taktikai Utasítások
          </h4>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold">Támadási stílus</label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {[
                  { id: 'fast', label: 'Gyors' },
                  { id: 'slow', label: 'Megfontolt' },
                  { id: 'three', label: 'Triplák' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setOffenseStyle(opt.id as any)}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      offenseStyle === opt.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold">Védekezési stílus</label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {[
                  { id: 'man', label: 'Emberfogás' },
                  { id: 'zone', label: 'Zóna' },
                  { id: 'press', label: 'Letámadás' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDefenseStyle(opt.id as any)}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      defenseStyle === opt.id
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS HUB */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Zap className="h-4 w-4 text-orange-500" />
            Vezérlőközpont
          </h4>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setMatchState(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null)}
              className={`p-3.5 rounded-full cursor-pointer transition-all ${
                matchState.isPaused 
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {matchState.isPaused ? <Play className="h-6 w-6 fill-current" /> : <Pause className="h-6 w-6" />}
            </button>

            {/* Speeds */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
              {[1, 2, 4].map((sp) => (
                <button
                  key={sp}
                  onClick={() => setMatchState(prev => prev ? { ...prev, speed: sp } : null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    matchState.speed === sp
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleInstantSimulate}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/50"
          >
            <SkipForward className="h-4 w-4" />
            Azonnali Szimuláció
          </button>
        </div>

        {/* SUBS HUB */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Users className="h-4 w-4 text-blue-500" />
            Meccs Alatti Csere
          </h4>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase">Lejön:</label>
              <select
                value={selectedStarterId}
                onChange={(e) => setSelectedStarterId(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="">Válassz kezdőt...</option>
                {homePlayers.filter(p => p.isStarter).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase">Beáll:</label>
              <select
                value={selectedBenchId}
                onChange={(e) => setSelectedBenchId(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="">Válassz cserejátékost...</option>
                {homePlayers.filter(p => !p.isStarter).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handlePerformSubstitution(selectedStarterId, selectedBenchId)}
              disabled={!selectedStarterId || !selectedBenchId}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-500 font-bold py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              Csere Végrehajtása
            </button>
          </div>
        </div>

      </div>

      {/* GAME COURT RADAR & TICKER COMMENTARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PLAY-BY-PLAY COMMENTARY */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:col-span-2 flex flex-col justify-between space-y-4">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            💬 Élő Közvetítés (Ticker)
          </h4>

          <div className="bg-slate-950 rounded-2xl p-4 h-[250px] overflow-y-auto space-y-3 font-sans border border-slate-850 shadow-inner">
            {matchState.ticker.map((line, idx) => (
              <p
                key={idx}
                className={`text-xs leading-relaxed ${
                  line.includes('🏀') || line.includes('🎉')
                    ? 'text-amber-400 font-bold'
                    : line.includes('🔄')
                    ? 'text-blue-400 font-semibold'
                    : line.includes('🔔') || line.includes('🏁')
                    ? 'text-indigo-400 font-bold bg-indigo-500/5 p-1 rounded border border-indigo-500/10 text-center'
                    : 'text-slate-300'
                }`}
              >
                {line}
              </p>
            ))}
            <div ref={tickerBottomRef} />
          </div>
          
          <div className="text-[10px] text-slate-500 text-right">
            Szimulált sebesség: {matchState.speed}x • Meccs ID: {matchId}
          </div>
        </div>

        {/* ACTIVE POSSESSION RADAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            🏟️ Labdabirtoklás radar
          </h4>

          <div className="relative h-44 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-center items-center gap-4">
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-800/80" />

            <div className="flex w-full px-6 justify-between items-center relative z-10">
              {/* Home Radar */}
              <div className="flex flex-col items-center">
                <span className={`text-xs font-bold ${matchState.possession === 'home' ? 'text-amber-500 scale-110 font-black' : 'text-slate-600'}`}>
                  {homeTeam.name.split(' ').pop()}
                </span>
                {matchState.possession === 'home' && (
                  <div className="h-3 w-3 bg-amber-500 rounded-full animate-ping mt-2" />
                )}
              </div>

              {/* Court Hoops */}
              <div className="text-center font-mono font-bold text-xl text-slate-800 select-none">
                VS
              </div>

              {/* Away Radar */}
              <div className="flex flex-col items-center">
                <span className={`text-xs font-bold ${matchState.possession === 'away' ? 'text-indigo-400 scale-110 font-black' : 'text-slate-600'}`}>
                  {awayTeam.name.split(' ').pop()}
                </span>
                {matchState.possession === 'away' && (
                  <div className="h-3 w-3 bg-indigo-400 rounded-full animate-ping mt-2" />
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-medium italic text-center px-4 relative z-10">
              {matchState.possession === 'home' 
                ? 'A hazai Budapest Kings vezeti a támadást a festékben!'
                : `A vendég ${awayTeam.name} hozza fel a labdát a tizenhatosnál!`}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-[10px] text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Kattints a csere vezérlőre, ha cserélni akarsz játék közben!
          </div>
        </div>

      </div>

      {/* MATCH STATS ACCORDION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          <Award className="h-5 w-5 text-amber-500" />
          Mérkőzés Egyéni Statisztikái (Dobólap)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Home Stats */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5 uppercase flex justify-between">
              <span>{homeTeam.name} dobólap</span>
              <span className="text-amber-500 font-mono font-black">{matchState.homeScore} PTS</span>
            </h5>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {(Object.values(matchState.homeStats) as LiveMatchPlayerStats[]).map((st) => (
                <div key={st.playerId} className="flex justify-between items-center text-xs p-2 rounded bg-slate-950/40 border border-slate-850">
                  <div>
                    <p className="font-bold text-slate-200">{st.name}</p>
                    <p className="text-[9px] text-slate-500 uppercase">{st.position} • AST: {st.assists} | REB: {st.rebounds} | STL: {st.steals} | BLK: {st.blocks}</p>
                  </div>
                  <span className="font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    {st.points} PTS
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Away Stats */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5 uppercase flex justify-between">
              <span>{awayTeam.name} dobólap</span>
              <span className="text-indigo-400 font-mono font-black">{matchState.awayScore} PTS</span>
            </h5>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {(Object.values(matchState.awayStats) as LiveMatchPlayerStats[]).map((st) => (
                <div key={st.playerId} className="flex justify-between items-center text-xs p-2 rounded bg-slate-950/40 border border-slate-850">
                  <div>
                    <p className="font-bold text-slate-200">{st.name}</p>
                    <p className="text-[9px] text-slate-500 uppercase">{st.position} • AST: {st.assists} | REB: {st.rebounds} | STL: {st.steals} | BLK: {st.blocks}</p>
                  </div>
                  <span className="font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    {st.points} PTS
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
