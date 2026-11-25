import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RosterManager from './components/RosterManager';
import TradeHub from './components/TradeHub';
import MatchSimulator from './components/MatchSimulator';
import Standings from './components/Standings';
import PressRoom from './components/PressRoom';
import PlayerMarket from './components/PlayerMarket';
import { INITIAL_TEAMS, INITIAL_PLAYERS } from './data/players';
import { generateSchedule } from './utils/scheduler';
import { simulateFullMatch } from './utils/gameEngine';
import { calculateSeasonMVP, getPlayerMvpScore } from './utils/mvp';
import { Team, Player, ScheduleItem, SeasonSettings, TradeOffer, LiveMatchPlayerStats } from './types';
import { Calendar, Play, Trophy, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  category: 'mérkőzés' | 'csere' | 'pletyka';
}

export default function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [season, setSeason] = useState<SeasonSettings>({
    round: 1,
    totalRounds: 14,
    draftCompleted: true,
    salaryCap: 140
  });
  const [activeTab, setActiveTab] = useState<string>('roster');
  const [activeOffers, setActiveOffers] = useState<TradeOffer[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Load state from localStorage on first boot, or initialize standard seeds
  useEffect(() => {
    const savedTeams = localStorage.getItem('nba_teams');
    const savedPlayers = localStorage.getItem('nba_players');
    const savedSchedule = localStorage.getItem('nba_schedule');
    const savedSeason = localStorage.getItem('nba_season');
    const savedOffers = localStorage.getItem('nba_offers');
    const savedArticles = localStorage.getItem('nba_articles');

    if (savedTeams && savedPlayers && savedSchedule && savedSeason) {
      const parsedTeams: Team[] = JSON.parse(savedTeams);
      setTeams(parsedTeams.map(t => ({
        ...t,
        cashBudget: t.cashBudget ?? (t.isUser ? 65 : 50)
      })));
      setPlayers(JSON.parse(savedPlayers));
      setSchedule(JSON.parse(savedSchedule));
      setSeason(JSON.parse(savedSeason));
      if (savedOffers) setActiveOffers(JSON.parse(savedOffers));
      if (savedArticles) setArticles(JSON.parse(savedArticles));
    } else {
      // Seed fresh state
      setTeams(INITIAL_TEAMS);
      setPlayers(INITIAL_PLAYERS);
      const teamIds = INITIAL_TEAMS.map(t => t.id);
      setSchedule(generateSchedule(teamIds));
    }
    setIsInitializing(false);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('nba_teams', JSON.stringify(teams));
    localStorage.setItem('nba_players', JSON.stringify(players));
    localStorage.setItem('nba_schedule', JSON.stringify(schedule));
    localStorage.setItem('nba_season', JSON.stringify(season));
    localStorage.setItem('nba_offers', JSON.stringify(activeOffers));
    localStorage.setItem('nba_articles', JSON.stringify(articles));
  }, [teams, players, schedule, season, activeOffers, articles, isInitializing]);

  const resetGame = () => {
    if (window.confirm('Biztosan visszaállítod az egész szezont? Minden elért eredmény és csere elveszik.')) {
      setTeams(INITIAL_TEAMS);
      setPlayers(INITIAL_PLAYERS);
      const teamIds = INITIAL_TEAMS.map(t => t.id);
      setSchedule(generateSchedule(teamIds));
      setSeason({
        round: 1,
        totalRounds: 14,
        draftCompleted: true,
        salaryCap: 140,
        isCompleted: false,
        mvpPlayerId: null
      });
      setActiveOffers([]);
      setArticles([]);
      setActiveTab('roster');
      setActiveMatchId(null);
    }
  };

  // --- ROSTER ACTIONS ---

  const handleToggleStarter = (playerId: string) => {
    setPlayers(prev => {
      const target = prev.find(p => p.id === playerId);
      if (!target) return prev;

      const userRoster = prev.filter(p => p.teamId === 'user_team');
      const activeStartersCount = userRoster.filter(p => p.isStarter).length;

      if (!target.isStarter && activeStartersCount >= 5) {
        // Cannot exceed 5 starters, must choose someone to put on bench first
        alert('Legfeljebb 5 játékos lehet egyszerre a kezdőötösben! Küldj valakit a kispadra először.');
        return prev;
      }

      return prev.map(p => p.id === playerId ? { ...p, isStarter: !p.isStarter } : p);
    });
  };

  const calculateTotalPayroll = () => {
    return players.filter(p => p.teamId === 'user_team').reduce((acc, p) => acc + p.salary, 0);
  };

  const handleSignPlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const currentPayroll = calculateTotalPayroll();
    if (currentPayroll + player.salary > season.salaryCap) {
      alert(`Sikertelen igazolás! A játékos fizetése ($${player.salary}M) túllépné a megengedett fizetési sapkát ($${season.salaryCap}M). Engedj el valakit előbb!`);
      return;
    }

    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, teamId: 'user_team', isStarter: false } : p));
  };

  const handleReleasePlayer = (playerId: string) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, teamId: 'free_agent', isStarter: false } : p));
  };

  // --- PLAYER BUYOUT / TRANSFER MARKET ACTIONS ---

  const handleBuyPlayer = (
    playerId: string,
    buyoutPrice: number,
    bypassCap = false
  ): { success: boolean; message: string } => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'A játékos nem található a rendszerben!' };
    if (player.teamId === 'user_team') return { success: false, message: 'Ez a játékos már a saját csapatod tagja!' };

    const uTeam = teams.find(t => t.isUser) || teams[0];
    const userCash = uTeam?.cashBudget ?? 65;

    if (userCash < buyoutPrice) {
      return {
        success: false,
        message: `Nincs elegendő klubkassza fedezeted! A játékos kivásárlási ára $${buyoutPrice.toFixed(1)}M, de a kasszádban jelenleg csak $${userCash.toFixed(1)}M áll rendelkezésre.`
      };
    }

    const currentPayroll = calculateTotalPayroll();
    if (!bypassCap && currentPayroll + player.salary > season.salaryCap) {
      return {
        success: false,
        message: `A játékos éves bére ($${player.salary.toFixed(1)}M) túllépné a fizetési sapkát ($${season.salaryCap}M)! Engedélyezd a luxusadós kivásárlást vagy engedj el valakit a keretedből.`
      };
    }

    const oldTeam = teams.find(t => t.id === player.teamId);

    // Deduct cash from user team, award to seller team (if not free agent)
    setTeams(prevTeams => prevTeams.map(t => {
      if (t.isUser) {
        return {
          ...t,
          cashBudget: Math.max(0, Math.round(((t.cashBudget ?? 65) - buyoutPrice) * 10) / 10)
        };
      }
      if (oldTeam && t.id === oldTeam.id && t.id !== 'free_agent') {
        return {
          ...t,
          cashBudget: Math.round(((t.cashBudget ?? 50) + buyoutPrice) * 10) / 10
        };
      }
      return t;
    }));

    // Transfer player to user_team
    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          teamId: 'user_team',
          isStarter: false
        };
      }
      return p;
    }));

    // Publish Article in Press Room
    const newArticle: Article = {
      id: `buy_${Date.now()}`,
      title: `ÁTIGAZOLÁSI SZENZÁCIÓ: ${player.name} hivatalosan is aláírt a ${uTeam?.name || 'Budapest Kings'} csapatához!`,
      content: player.teamId === 'free_agent'
        ? `A(z) ${uTeam?.name} vezetősége leigazolta ${player.name}-t a szabadügynök piacról, aki évi $${player.salary.toFixed(1)}M-s szerződéssel érkezik a fővárosi gárdához.`
        : `A(z) ${uTeam?.name} kifizette a ${oldTeam?.name || 'másik csapat'} részére a ${buyoutPrice.toFixed(1)}M dolláros kivásárlási díjat, így ${player.name} azonnal megérkezett a csapathoz!`,
      timestamp: 'Éppen most',
      category: 'csere'
    };
    setArticles(prev => [newArticle, ...prev]);

    return {
      success: true,
      message: `Sikeres átigazolás! ${player.name} mostantól a ${uTeam?.name || 'csapatod'} játékosa!`
    };
  };

  const handleAddFunds = (amount: number) => {
    setTeams(prev => prev.map(t => {
      if (t.isUser) {
        return {
          ...t,
          cashBudget: Math.round(((t.cashBudget ?? 65) + amount) * 10) / 10
        };
      }
      return t;
    }));
  };

  // --- TRADING SYSTEM ACTIONS ---

  const handleAcceptOffer = (offerId: string) => {
    const offer = activeOffers.find(o => o.id === offerId);
    if (!offer) return;

    // Swap players
    setPlayers(prev => {
      return prev.map(p => {
        if (offer.senderPlayerIds.includes(p.id)) {
          return { ...p, teamId: offer.receiverTeamId, isStarter: false };
        }
        if (offer.receiverPlayerIds.includes(p.id)) {
          return { ...p, teamId: offer.senderTeamId, isStarter: false };
        }
        return p;
      });
    });

    // Save Article
    const senderTeam = teams.find(t => t.id === offer.senderTeamId);
    const receiverTeam = teams.find(t => t.id === offer.receiverTeamId);
    const senderPlayerNames = players.filter(p => offer.senderPlayerIds.includes(p.id)).map(p => p.name);
    const receiverPlayerNames = players.filter(p => offer.receiverPlayerIds.includes(p.id)).map(p => p.name);

    const newArticle: Article = {
      id: `trade_${Date.now()}`,
      title: `CSEREPIAC HÍREK: Hatalmas megállapodás született a ${senderTeam?.name} és a ${receiverTeam?.name} között!`,
      content: `A mai napon bejelentették, hogy hivatalosan is aláírták a megállapodást. A csere értelmében a ${senderTeam?.city} elengedte a következő sztárokat: ${senderPlayerNames.join(', ')}. Cserébe a ${receiverTeam?.city} gárdájához kerülnek: ${receiverPlayerNames.join(', ')}. A szakértők szerint ez az üzlet mindkét franchise számára merész, de kifizetődő húzás lehet a rájátszásért vívott küzdelemben.`,
      timestamp: 'Éppen most',
      category: 'csere'
    };

    setArticles(prev => [newArticle, ...prev]);
    setActiveOffers(prev => prev.filter(o => o.id !== offerId));
    alert('A csere sikeresen létrejött! A játékosok átkerültek a keretekbe.');
  };

  const handleDeclineOffer = (offerId: string) => {
    setActiveOffers(prev => prev.filter(o => o.id !== offerId));
  };

  const handleProposeTrade = (
    senderTeamId: string,
    receiverTeamId: string,
    senderPlayerIds: string[],
    receiverPlayerIds: string[]
  ) => {
    const senderTeam = teams.find(t => t.id === senderTeamId)!;
    const receiverTeam = teams.find(t => t.id === receiverTeamId)!;

    const senderPlayers = players.filter(p => senderPlayerIds.includes(p.id));
    const receiverPlayers = players.filter(p => receiverPlayerIds.includes(p.id));

    const senderOvrSum = senderPlayers.reduce((acc, p) => acc + p.ovr, 0);
    const receiverOvrSum = receiverPlayers.reduce((acc, p) => acc + p.ovr, 0);

    // AI evaluate rules based on OVR difference
    let isAccepted = false;
    let message = "";

    // Base value evaluate
    const valueDiff = senderOvrSum - receiverOvrSum;

    if (receiverTeam.gmPersonality === 'greedy') {
      isAccepted = valueDiff >= 6; // Requires high value
      message = isAccepted 
        ? "Remek üzletet kötöttünk, nagyon elégedett vagyok ezzel a megállapodással!"
        : "Ez nekünk nem éri meg. Tegyél le valami komolyabb értéket az asztalra, ha meg akarod kapni a játékosaimat!";
    } else if (receiverTeam.gmPersonality === 'analyst') {
      isAccepted = valueDiff >= 0; // Requires balanced value
      message = isAccepted
        ? "Az adatelemző szoftvereink jóváhagyták a cserét, növelni fogja a dobóhatékonyságunkat."
        : "A statisztikai modelljeink szerint ez a csere rontaná a győzelmi arányunkat, sajnáljuk.";
    } else if (receiverTeam.gmPersonality === 'aggressive') {
      isAccepted = valueDiff >= -3; // More flexible for high potential
      message = isAccepted
        ? "Nekem tetszik ez a merészség! Csináljuk meg, hozzuk tető alá a cserét!"
        : "Ez gyenge kísérlet volt. Ennél sokkal jobb ajánlat kell, hogy elengedjük a sztárjainkat.";
    } else {
      isAccepted = valueDiff >= -1; // Fair standard
      message = isAccepted
        ? "Ez egy korrekt csereajánlat mindkét félnek. Küldheted a szerződéseket!"
        : "Sajnálom, de jelenleg nem akarunk megválni ezektől a játékosoktól ilyen feltételekkel.";
    }

    if (isAccepted) {
      // Execute trade swaps
      setPlayers(prev => {
        return prev.map(p => {
          if (senderPlayerIds.includes(p.id)) {
            return { ...p, teamId: receiverTeamId, isStarter: false };
          }
          if (receiverPlayerIds.includes(p.id)) {
            return { ...p, teamId: senderTeamId, isStarter: false };
          }
          return p;
        });
      });

      // Save news article
      const newArticle: Article = {
        id: `trade_${Date.now()}`,
        title: `CSEREPIAC HÍREK: Hivatalos! ${senderTeam.name} megegyezett a ${receiverTeam.name} gárdájával!`,
        content: `Rendkívüli bejelentés rázta meg a kosárlabda világát. A Budapest Kings sikeres cserealakut bonyolított le. Átadott játékosok: ${senderPlayers.map(p => p.name).join(', ')}. Érkező játékosok: ${receiverPlayers.map(p => p.name).join(', ')}. A ${receiverTeam.city} GM-je, ${receiverTeam.gmName} szerint ez az üzlet azonnali előrelépést garantál a csapatnak.`,
        timestamp: 'Éppen most',
        category: 'csere'
      };
      setArticles(prev => [newArticle, ...prev]);

      // Call Gemini for generated GM response asynchronously (safe proxy)
      fetch('/api/generate-trade-commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderTeamName: senderTeam.name,
          receiverTeamName: receiverTeam.name,
          senderPlayerNames: senderPlayers.map(p => p.name),
          receiverPlayerNames: receiverPlayers.map(p => p.name),
          gmName: receiverTeam.gmName,
          gmPersonality: receiverTeam.gmPersonality,
          action: 'accept'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.text) {
          // Add custom GM response to news stream
        }
      })
      .catch(err => console.log('AI response fetch failed', err));
    }

    return {
      success: isAccepted,
      message: message
    };
  };

  // --- MATCH SIMULATION ROUND CYCLE ---

  const handleFinishMatch = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
    homeStats: Record<string, LiveMatchPlayerStats>,
    awayStats: Record<string, LiveMatchPlayerStats>
  ) => {
    // Look up match and home/away team entities for record updating
    // Note: MatchSimulator always passes userTeam as homeTeam and currentOpponent as awayTeam
    const userMatch = schedule.find(m => m.id === matchId)!;
    const isUserHome = userMatch.homeTeamId === 'user_team';
    const opponentTeamId = isUserHome ? userMatch.awayTeamId : userMatch.homeTeamId;
    const opponentTeam = teams.find(t => t.id === opponentTeamId)!;
    const currentUserTeam = teams.find(t => t.id === 'user_team')!;

    const userScore = homeScore;
    const oppScore = awayScore;

    // 1. Simulate all other matches of the current round instantly so full league stats & records stay in sync
    const roundMatchesToSim = schedule.filter(m => m.round === season.round && m.id !== matchId && !m.played);
    const simmedMatches: Record<string, {
      homeTeamId: string;
      awayTeamId: string;
      hScore: number;
      aScore: number;
      homeStats: Record<string, LiveMatchPlayerStats>;
      awayStats: Record<string, LiveMatchPlayerStats>;
    }> = {};

    roundMatchesToSim.forEach(m => {
      const result = simulateFullMatch(m.homeTeamId, m.awayTeamId, players);
      simmedMatches[m.id] = {
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        hScore: result.homeScore,
        aScore: result.awayScore,
        homeStats: result.homeStats,
        awayStats: result.awayStats
      };
    });

    // 2. Collect all player match stats across all matches in this round
    const roundPlayerStats: Record<string, LiveMatchPlayerStats> = {};
    const recordActiveStats = (statsMap: Record<string, LiveMatchPlayerStats>, requireParticipationCheck: boolean) => {
      Object.values(statsMap).forEach(st => {
        if (requireParticipationCheck) {
          const p = players.find(pl => pl.id === st.playerId);
          const participated = p?.isStarter ||
            st.points > 0 ||
            st.rebounds > 0 ||
            st.assists > 0 ||
            st.blocks > 0 ||
            st.steals > 0 ||
            st.fouls > 0 ||
            st.turnovers > 0;
          if (!participated) return;
        }
        roundPlayerStats[st.playerId] = st;
      });
    };

    recordActiveStats(homeStats, true);
    recordActiveStats(awayStats, true);
    Object.values(simmedMatches).forEach(sim => {
      recordActiveStats(sim.homeStats, false);
      recordActiveStats(sim.awayStats, false);
    });

    // 3. Update all league players' season averages synchronously so we can compute Season MVP if season ended
    const updatedPlayers = players.map(p => {
      const statsInMatch = roundPlayerStats[p.id];
      if (!statsInMatch) return p;

      const currentGames = p.stats.gamesPlayed;
      const newGames = currentGames + 1;

      const newPpg = (p.stats.ppg * currentGames + statsInMatch.points) / newGames;
      const newRpg = (p.stats.rpg * currentGames + statsInMatch.rebounds) / newGames;
      const newApg = (p.stats.apg * currentGames + statsInMatch.assists) / newGames;
      const newBpg = (p.stats.bpg * currentGames + statsInMatch.blocks) / newGames;
      const newSpg = (p.stats.spg * currentGames + statsInMatch.steals) / newGames;

      return {
        ...p,
        stats: {
          ppg: newPpg,
          rpg: newRpg,
          apg: newApg,
          bpg: newBpg,
          spg: newSpg,
          gamesPlayed: newGames
        }
      };
    });
    setPlayers(updatedPlayers);

    // 4. Update schedule items for user match and simulated matches
    const updatedSchedule = schedule.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          played: true,
          homeScore: isUserHome ? userScore : oppScore,
          awayScore: isUserHome ? oppScore : userScore
        };
      }
      if (simmedMatches[m.id]) {
        return {
          ...m,
          played: true,
          homeScore: simmedMatches[m.id].hScore,
          awayScore: simmedMatches[m.id].aScore
        };
      }
      return m;
    });
    setSchedule(updatedSchedule);

    // 5. Update all team standings records (user match + simulated matches)
    const updateTeamRecord = (team: Team, scored: number, allowed: number): Team => {
      const isWinner = scored > allowed;
      const wins = isWinner ? team.wins + 1 : team.wins;
      const losses = !isWinner ? team.losses + 1 : team.losses;
      const currentStreakNum = team.streak !== '-' ? parseInt(team.streak.substring(2)) || 1 : 0;
      const isStreakSame = (isWinner && team.streak.startsWith('GY')) || (!isWinner && team.streak.startsWith('V'));
      const newStreak = isWinner
        ? `GY ${isStreakSame ? currentStreakNum + 1 : 1}`
        : `V ${isStreakSame ? currentStreakNum + 1 : 1}`;

      return {
        ...team,
        wins,
        losses,
        pointsFor: team.pointsFor + scored,
        pointsAgainst: team.pointsAgainst + allowed,
        streak: newStreak
      };
    };

    setTeams(prev => prev.map(t => {
      if (t.id === 'user_team') {
        return updateTeamRecord(t, userScore, oppScore);
      }
      if (t.id === opponentTeam.id) {
        return updateTeamRecord(t, oppScore, userScore);
      }
      for (const sim of Object.values(simmedMatches)) {
        if (t.id === sim.homeTeamId) {
          return updateTeamRecord(t, sim.hScore, sim.aScore);
        }
        if (t.id === sim.awayTeamId) {
          return updateTeamRecord(t, sim.aScore, sim.hScore);
        }
      }
      return t;
    }));

    // 6. Check if the season has just ended & calculate Season MVP
    const isSeasonNowOver = updatedSchedule.length > 0 && updatedSchedule.every(m => m.played);
    const calculatedMvp = isSeasonNowOver ? calculateSeasonMVP(updatedPlayers) : null;

    if (isSeasonNowOver && calculatedMvp) {
      const mvpTeam = teams.find(t => t.id === calculatedMvp.teamId);
      const mvpScore = getPlayerMvpScore(calculatedMvp).toFixed(1);
      const mvpArticle: Article = {
        id: `mvp_${Date.now()}`,
        title: `🏆 SZEZON MVP BEJELENTÉS: ${calculatedMvp.name} lett az alapszakasz legértékesebb játékosa!`,
        content: `Véget ért a ${season.totalRounds} fordulós alapszakasz, és a liga hivatalosan is kihirdette a Szezon MVP díj győztesét! A legmagasabb szezonátlag teljesítménymutatóval (PPG + RPG + APG = ${mvpScore}) ${calculatedMvp.name} (${mvpTeam ? `${mvpTeam.city} ${mvpTeam.name}` : 'Szabadügynök'}) végzett az élen: ${calculatedMvp.stats.ppg.toFixed(1)} pont, ${calculatedMvp.stats.rpg.toFixed(1)} lepattanó és ${calculatedMvp.stats.apg.toFixed(1)} gólpassz mérkőzésenként!`,
        timestamp: 'Éppen most',
        category: 'mérkőzés'
      };
      setArticles(prev => [mvpArticle, ...prev]);
    }

    // 7. Generate AI sport news recap for user match
    const topPerformers = Object.values(homeStats)
      .concat(Object.values(awayStats))
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);

    try {
      const aiRecapRes = await fetch('/api/generate-match-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeamName: currentUserTeam.name,
          awayTeamName: opponentTeam.name,
          homeScore: userScore,
          awayScore: oppScore,
          topPlayers: topPerformers.map(p => ({
            name: p.name,
            points: p.points,
            rebounds: p.rebounds,
            assists: p.assists
          }))
        })
      });
      const recapData = await aiRecapRes.json();
      if (recapData.text) {
        // Parse Title and Body
        const lines = recapData.text.split('\n');
        const title = lines[0].replace('###', '').replace(/\*/g, '').trim() || `TUDÓSÍTÁS: ${currentUserTeam.name} - ${opponentTeam.name}`;
        const content = lines.slice(1).join('\n').trim();

        const matchArticle: Article = {
          id: `match_${Date.now()}`,
          title: title,
          content: content,
          timestamp: 'Éppen most',
          category: 'mérkőzés'
        };
        setArticles(prev => [matchArticle, ...prev]);
      }
    } catch (err) {
      console.log('AI Match Recap failed, fallback used');
    }

    // 8. Generate a 35% chance proactive trade proposal from computer GM (only if season continues)
    if (!isSeasonNowOver && Math.random() < 0.35) {
      const activeTeamsForProposals = teams.filter(t => !t.isUser);
      const chosenCompTeam = activeTeamsForProposals[Math.floor(Math.random() * activeTeamsForProposals.length)];
      const compPlayers = updatedPlayers.filter(p => p.teamId === chosenCompTeam.id);
      const userPlayers = updatedPlayers.filter(p => p.teamId === 'user_team');

      if (compPlayers.length > 0 && userPlayers.length > 0) {
        const pGive = compPlayers[Math.floor(Math.random() * compPlayers.length)];
        const pTake = userPlayers[Math.floor(Math.random() * userPlayers.length)];

        const messages = [
          `Szia! Figyelem ${pTake.name} remek formáját, és úgy gondoljuk, nálunk nagyot alkothatna. Cserébe odaadjuk ${pGive.name}-t, szerintem mindkét csapat jól járna. Mit szólsz?`,
          `Üdv! Szeretnénk átrendezni a keretünket a rájátszásra, és szívesen megszereznénk ${pTake.name}-t. Cserébe felajánlom ${pGive.name}-t, aki tökéletesen beleillene a támadórendszeredbe.`,
          `Figyelj, tegyünk egy próbát! Mit szólnál egy ${pGive.name} - ${pTake.name} közvetlen játékos-cseréhez? Mindkettőnknek jót tenne az új vér!`
        ];

        const newOffer: TradeOffer = {
          id: `offer_${Date.now()}`,
          senderTeamId: chosenCompTeam.id,
          receiverTeamId: 'user_team',
          senderPlayerIds: [pGive.id],
          receiverPlayerIds: [pTake.id],
          status: 'pending',
          message: messages[Math.floor(Math.random() * messages.length)]
        };
        setActiveOffers(prev => [newOffer, ...prev]);
      }
    }

    // 9. Advance Season Round & mark completion
    setSeason(prev => {
      const nextRound = prev.round < prev.totalRounds ? prev.round + 1 : prev.round;
      return {
        ...prev,
        round: nextRound,
        isCompleted: isSeasonNowOver,
        mvpPlayerId: calculatedMvp ? calculatedMvp.id : prev.mvpPlayerId
      };
    });

    // Return to standings or press tab
    setActiveMatchId(null);
    setActiveTab(isSeasonNowOver ? 'standings' : 'press');
    if (isSeasonNowOver && calculatedMvp) {
      alert(`🏁 A szezon véget ért! A Szezon MVP díjat ${calculatedMvp.name} nyerte (${getPlayerMvpScore(calculatedMvp).toFixed(1)} PPG+RPG+APG)!`);
    } else {
      alert(`A forduló véget ért! Megérkeztek a meccseredmények. Készült egy tudósítás is a Sajtószobában.`);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans gap-3">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
        <p className="text-sm font-semibold">NBA Arena Draft töltése...</p>
      </div>
    );
  }

  const userTeam = teams.find(t => t.isUser)!;
  const isSeasonEnded = schedule.length > 0 && schedule.every(m => m.played);
  const seasonMvpPlayer = isSeasonEnded ? calculateSeasonMVP(players) : null;
  const seasonMvpId = seasonMvpPlayer?.id ?? null;

  const currentRoundMatch = !isSeasonEnded
    ? schedule.find(m => !m.played && m.round === season.round && (m.homeTeamId === 'user_team' || m.awayTeamId === 'user_team'))
    : undefined;
  const currentOpponentId = currentRoundMatch 
    ? (currentRoundMatch.homeTeamId === 'user_team' ? currentRoundMatch.awayTeamId : currentRoundMatch.homeTeamId)
    : null;
  const currentOpponent = teams.find(t => t.id === currentOpponentId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans pb-16">
      
      {/* HEADER COMPONENT */}
      <Header
        userTeam={userTeam}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        season={season}
        totalPayroll={calculateTotalPayroll()}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* WARNING ALERT IF NO STARTERS ACTIVE */}
        {activeTab === 'play' && players.filter(p => p.teamId === 'user_team' && p.isStarter).length === 0 && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-rose-500 animate-bounce" />
              <div>
                <p className="font-bold text-rose-400 text-sm">Nincsenek aktív kezdőjátékosaid!</p>
                <p className="text-xs text-slate-400 mt-0.5">A mérkőzés szimuláció elindításához jelölj ki pontosan 5 kezdőjátékost a Csapat & Lineup menüpontban.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('roster')}
              className="bg-rose-500 hover:bg-rose-600 text-slate-950 hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Kezdők Kijelölése
            </button>
          </div>
        )}

        {/* ACTIVE MAIN CONTENT SCREEN PANELS */}
        {activeMatchId ? (
          // LIVE MATCH SIMULATOR IN ACTION (Takes over the page)
          <MatchSimulator
            matchId={activeMatchId}
            homeTeam={userTeam}
            awayTeam={currentOpponent!}
            players={players}
            onFinishMatch={handleFinishMatch}
          />
        ) : (
          <>
            {/* TAB: ROSTER MANAGER */}
            {activeTab === 'roster' && (
              <RosterManager
                players={players}
                onToggleStarter={handleToggleStarter}
                onSignPlayer={handleSignPlayer}
                onReleasePlayer={handleReleasePlayer}
                salaryCap={season.salaryCap}
                totalPayroll={calculateTotalPayroll()}
                onNavigateToMarket={() => setActiveTab('market')}
                seasonMvpId={seasonMvpId}
              />
            )}

            {/* TAB: PLAYER BUYOUT & TRANSFER MARKET */}
            {activeTab === 'market' && (
              <PlayerMarket
                players={players}
                teams={teams}
                userTeam={userTeam}
                onBuyPlayer={handleBuyPlayer}
                onAddFunds={handleAddFunds}
                salaryCap={season.salaryCap}
                totalPayroll={calculateTotalPayroll()}
                onNavigateToRoster={() => setActiveTab('roster')}
                seasonMvpId={seasonMvpId}
              />
            )}

            {/* TAB: TRADE CENTER */}
            {activeTab === 'trades' && (
              <TradeHub
                teams={teams}
                players={players}
                activeOffers={activeOffers}
                onAcceptOffer={handleAcceptOffer}
                onDeclineOffer={handleDeclineOffer}
                onProposeTrade={handleProposeTrade}
                salaryCap={season.salaryCap}
                onBuyPlayer={handleBuyPlayer}
                onNavigateToMarket={() => setActiveTab('market')}
                seasonMvpId={seasonMvpId}
              />
            )}

            {/* TAB: PLAY MATCHES */}
            {activeTab === 'play' && (
              <div className="space-y-6" id="play-match-view">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md max-w-2xl mx-auto text-center space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
                      <Calendar className="h-6 w-6 text-amber-500" />
                      Mérkőzés Központ
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Következő forduló mérkőzése áll eltted. Készítsd fel a csapatod!</p>
                  </div>

                  {currentRoundMatch && currentOpponent ? (
                    <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-6 grid grid-cols-3 items-center text-center gap-4 relative">
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/10 text-amber-500 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
                        {season.round}. Forduló
                      </div>

                      {/* User Team */}
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center font-bold text-lg text-white">
                          K
                        </div>
                        <p className="text-xs font-bold text-slate-200 mt-1.5 truncate max-w-[120px]">{userTeam.name}</p>
                      </div>

                      {/* VS */}
                      <div className="font-black text-slate-700 tracking-wider font-mono text-lg select-none">
                        VS
                      </div>

                      {/* Opponent */}
                      <div className="flex flex-col items-center">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${currentOpponent.color} flex items-center justify-center font-bold text-lg text-white`}>
                          {currentOpponent.name.charAt(0)}
                        </div>
                        <p className="text-xs font-bold text-slate-200 mt-1.5 truncate max-w-[120px]">{currentOpponent.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 border border-amber-500/30 p-5 rounded-2xl text-xs text-slate-300 space-y-4">
                      <p className="text-sm font-bold text-amber-400">
                        🎉 Gratulálunk! A szezont befejezted. Ellenőrizd a végső tabellát!
                      </p>
                      {seasonMvpPlayer && (
                        <div className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                              <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Szezon MVP</p>
                              <p className="text-sm font-black text-white flex items-center gap-1.5">
                                <Trophy className="h-4 w-4 text-amber-400 fill-amber-400/25 shrink-0" />
                                <span>{seasonMvpPlayer.name}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <p className="text-xs font-bold text-amber-300">
                              {getPlayerMvpScore(seasonMvpPlayer).toFixed(1)} MVP Index
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {seasonMvpPlayer.stats.ppg.toFixed(1)} PPG / {seasonMvpPlayer.stats.rpg.toFixed(1)} RPG / {seasonMvpPlayer.stats.apg.toFixed(1)} APG
                            </p>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => setActiveTab('standings')}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        Végső Tabella & MVP Megtekintése
                      </button>
                    </div>
                  )}

                  {currentRoundMatch && (
                    <button
                      onClick={() => setActiveMatchId(currentRoundMatch.id)}
                      disabled={players.filter(p => p.teamId === 'user_team' && p.isStarter).length === 0}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-slate-800 disabled:to-slate-850 text-slate-950 disabled:text-slate-500 font-black text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-500/10"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Mérkőzés Elindítása
                    </button>
                  )}
                </div>

                {/* SCHEDULE ROUNDS DISPLAY */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md max-w-4xl mx-auto space-y-4">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Szezon Fő sorsolása
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[350px] pr-1">
                    {schedule.map((match) => {
                      const hTeam = teams.find(t => t.id === match.homeTeamId);
                      const aTeam = teams.find(t => t.id === match.awayTeamId);

                      return (
                        <div key={match.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 flex justify-between items-center text-[11px]">
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Forduló {match.round}</p>
                            <p className="text-slate-300 font-semibold mt-1">
                              {hTeam?.name.split(' ').pop()} vs {aTeam?.name.split(' ').pop()}
                            </p>
                          </div>
                          {match.played ? (
                            <span className="font-mono font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                              {match.homeScore} - {match.awayScore}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold uppercase text-[9px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              Sorsolt
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: STANDINGS */}
            {activeTab === 'standings' && (
              <Standings
                teams={teams}
                players={players}
                seasonMvpId={seasonMvpId}
                isSeasonEnded={isSeasonEnded}
              />
            )}

            {/* TAB: PRESS ROOM */}
            {activeTab === 'press' && (
              <PressRoom articles={articles} />
            )}
          </>
        )}

        {/* BOTTOM UTILITY / ACTIONS BAR */}
        {!activeMatchId && (
          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>NBA Arena Draft & Trade Manager • Hungarian Version 1.0</p>
            <button
              onClick={resetGame}
              className="bg-slate-900/60 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 text-slate-400 py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
            >
              Szezon Visszaállítása
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
