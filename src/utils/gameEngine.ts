import { Player, LiveMatchPlayerStats, Position } from '../types';

// Hungarian Commentary Templates
const COMMENTARIES = {
  three_success: [
    "[SHOOTER] egy óriási triplával jelentkezik a sarokból!",
    "[SHOOTER] teljesen üresen maradt a triplavonalon kívül, és könyörtelenül beveri!",
    "[SHOOTER] messziről elvállalja... BUMM! Csodás hármas!",
    "A labda körbepörög a gyűrűn... és végül BEESIK! [SHOOTER] hárompontosa sikeres!",
    "[SHOOTER] hidegvérrel süllyeszt el egy távoli triplát!"
  ],
  two_success: [
    "[SHOOTER] betör a festékbe és egy elegáns ziccerrel fejezi be!",
    "[SHOOTER] felugrik a védők gyűrűjében és hatalmasat ZSÁKOL!",
    "[SHOOTER] szép középtávoli tempódobással iratkozik fel az eredményjelzőre!",
    "[SHOOTER] kiharcolja a pozíciót a palánk alatt, megfordul és bedobja!",
    "[SHOOTER] fantasztikus betörés után egy leheletfinom úszó ziccert szerez!"
  ],
  and_one: [
    "[SHOOTER] bedobja a ziccert faulttal együtt! Jár a plusz egy büntető... és az is BENT VAN!",
    "[SHOOTER] kőkemény fault ellenére is beteszi a labdát! Kosár és egy büntető!"
  ],
  miss: [
    "[SHOOTER] tempódobása elpattan a gyűrűről, kimarad.",
    "[SHOOTER] nehéz helyzetből triplát vállal, de csak a palánkot találja el.",
    "[SHOOTER] megpróbálja elhelyezni a ziccert, de a labda kicsorog a gyűrűről.",
    "[SHOOTER] elhamarkodott távoli dobása nagyon rövid, airball!"
  ],
  block: [
    "[DEFENDER] kőkeményen blokkolja [SHOOTER] dobási kísérletét! Micsoda sapka!",
    "[DEFENDER] a levegőben úszva takarítja el [SHOOTER] ziccerét! Hihetetlen védekezés!"
  ],
  steal: [
    "[DEFENDER] lefüleli a passzt és megindul az ellenfél palánkja felé!",
    "[DEFENDER] agresszíven leüti a labdát [SHOOTER] kezéről, tiszta labdaszerzés!"
  ],
  rebound: [
    "[REBOUNDER] emelkedik a legmagasabbra és lekapja a lepattanót.",
    "[REBOUNDER] harcol ki pozíciót és megszerzi a labdát a palánk alatt.",
    "[REBOUNDER] agresszív letámadás után begyűjti a szabad lepattanót."
  ],
  turnover: [
    "[PLAYER] eladja a labdát, pontatlan passz!",
    "[PLAYER] lépéshibát követ el, labdavesztés!",
    "[PLAYER] kivezeti a labdát a játéktérről."
  ],
  foul: [
    "[DEFENDER] szabálytalanul lép oda [SHOOTER] ellen, fault!",
    "[DEFENDER] odacsap [SHOOTER] kezére, sípol a játékvezető."
  ]
};

export function initMatchStats(players: Player[]): Record<string, LiveMatchPlayerStats> {
  const stats: Record<string, LiveMatchPlayerStats> = {};
  players.forEach(p => {
    stats[p.id] = {
      playerId: p.id,
      name: p.name,
      position: p.position,
      points: 0,
      rebounds: 0,
      assists: 0,
      blocks: 0,
      steals: 0,
      fouls: 0,
      turnovers: 0
    };
  });
  return stats;
}

// Generate single possession play-by-play
export function simulatePossession(
  attackingTeamId: string,
  attackingPlayers: Player[],
  defendingPlayers: Player[],
  homeStats: Record<string, LiveMatchPlayerStats>,
  awayStats: Record<string, LiveMatchPlayerStats>,
  isHomeAttacking: boolean,
  tactics: {
    offenseStyle: 'fast' | 'slow' | 'three';
    defenseStyle: 'man' | 'zone' | 'press';
  }
): {
  scoreChange: number;
  commentary: string;
  possessionSwaps: boolean;
} {
  const attackingStats = isHomeAttacking ? homeStats : awayStats;
  const defendingStats = isHomeAttacking ? awayStats : homeStats;
  
  // 1. Calculate overall team attributes
  const teamOffense = attackingPlayers.reduce((acc, p) => acc + p.ovr + (p.shooting3pt * 0.2) + (p.playmaking * 0.2), 0) / attackingPlayers.length;
  const teamDefense = defendingPlayers.reduce((acc, p) => acc + p.ovr + (p.defense * 0.4), 0) / defendingPlayers.length;
  
  // Tactical adjustments
  let shootingChanceMod = 0;
  let turnoversChance = 0.08; // 8% baseline turnover
  let threePointAttemptRate = 0.35; // 35% baseline
  
  if (tactics.offenseStyle === 'fast') {
    shootingChanceMod += 3;
    turnoversChance += 0.04;
  } else if (tactics.offenseStyle === 'slow') {
    shootingChanceMod -= 2;
    turnoversChance -= 0.03;
  } else if (tactics.offenseStyle === 'three') {
    threePointAttemptRate = 0.60;
  }
  
  if (tactics.defenseStyle === 'press') {
    turnoversChance += 0.05;
  }
  
  // Choose key players weighted by their attributes
  const selectPlayerByWeight = (playersList: Player[], weightFn: (p: Player) => number): Player => {
    const weights = playersList.map(weightFn);
    const sum = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * sum;
    for (let i = 0; i < playersList.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return playersList[i];
    }
    return playersList[0];
  };
  
  // Random event: Turnover / Steal before shooting
  if (Math.random() < turnoversChance) {
    const errorPlayer = selectPlayerByWeight(attackingPlayers, p => 100 - p.playmaking);
    if (Math.random() < 0.6) {
      // Steal by defending team
      const stealer = selectPlayerByWeight(defendingPlayers, p => p.defense + p.stamina * 0.1);
      
      // Update stats
      if (defendingStats[stealer.id]) defendingStats[stealer.id].steals++;
      if (attackingStats[errorPlayer.id]) attackingStats[errorPlayer.id].turnovers++;
      
      const template = COMMENTARIES.steal[Math.floor(Math.random() * COMMENTARIES.steal.length)];
      return {
        scoreChange: 0,
        commentary: template.replace("[DEFENDER]", stealer.name).replace("[SHOOTER]", errorPlayer.name),
        possessionSwaps: true
      };
    } else {
      // Simple turnover
      if (attackingStats[errorPlayer.id]) attackingStats[errorPlayer.id].turnovers++;
      const template = COMMENTARIES.turnover[Math.floor(Math.random() * COMMENTARIES.turnover.length)];
      return {
        scoreChange: 0,
        commentary: template.replace("[PLAYER]", errorPlayer.name),
        possessionSwaps: true
      };
    }
  }
  
  // Decide shooter (highly weighted by offensive skills)
  const shooter = selectPlayerByWeight(attackingPlayers, p => p.ovr + p.pointsInside * 0.3 + p.shooting3pt * 0.3);
  
  // Determine if 3PT or 2PT
  const isThree = Math.random() < (threePointAttemptRate + (shooter.shooting3pt - 80) * 0.005);
  
  // Calculate scoring success percentage
  let baseScoringPercent = isThree ? 35 : 48; // NBA league averages roughly
  let skillDiff = isThree 
    ? (shooter.shooting3pt - teamDefense) 
    : ((shooter.pointsInside + shooter.ovr) / 2 - teamDefense);
    
  let scoringPercent = baseScoringPercent + skillDiff * 0.3 + shootingChanceMod;
  
  // Cap scoring percentages realistically
  scoringPercent = Math.max(isThree ? 15 : 25, Math.min(isThree ? 65 : 80, scoringPercent));
  
  // Check Block before shot resolves
  if (Math.random() < (0.05 + (teamDefense - 80) * 0.002)) {
    const blocker = selectPlayerByWeight(defendingPlayers, p => p.defense + p.rebounding * 0.2);
    if (defendingStats[blocker.id]) defendingStats[blocker.id].blocks++;
    
    const template = COMMENTARIES.block[Math.floor(Math.random() * COMMENTARIES.block.length)];
    // Rebound roll after block
    const isDefensiveRebound = Math.random() < 0.75;
    const rebounder = isDefensiveRebound 
      ? selectPlayerByWeight(defendingPlayers, p => p.rebounding)
      : selectPlayerByWeight(attackingPlayers, p => p.rebounding);
      
    if (isDefensiveRebound) {
      if (defendingStats[rebounder.id]) defendingStats[rebounder.id].rebounds++;
    } else {
      if (attackingStats[rebounder.id]) attackingStats[rebounder.id].rebounds++;
    }
    
    return {
      scoreChange: 0,
      commentary: template.replace("[DEFENDER]", blocker.name).replace("[SHOOTER]", shooter.name) + 
                  ` Lepattanó: ${rebounder.name}.`,
      possessionSwaps: isDefensiveRebound
    };
  }
  
  // Roll for shot success
  const shotSucceeds = Math.random() * 100 < scoringPercent;
  
  if (shotSucceeds) {
    let score = isThree ? 3 : 2;
    let isAndOne = false;
    let passer: Player | null = null;
    let commentary = "";
    
    // Assist roll (60% of made field goals)
    if (Math.random() < 0.6) {
      const remainingStarters = attackingPlayers.filter(p => p.id !== shooter.id);
      if (remainingStarters.length > 0) {
        passer = selectPlayerByWeight(remainingStarters, p => p.playmaking);
        if (attackingStats[passer.id]) attackingStats[passer.id].assists++;
      }
    }
    
    // Check "And-1" on inside shots (7% chance)
    if (!isThree && Math.random() < 0.07) {
      isAndOne = true;
      score += 1;
      const defFouler = selectPlayerByWeight(defendingPlayers, p => 100 - p.defense);
      if (defendingStats[defFouler.id]) defendingStats[defFouler.id].fouls++;
    }
    
    // Record points
    if (attackingStats[shooter.id]) attackingStats[shooter.id].points += score;
    
    // Compile commentary
    if (isAndOne) {
      const template = COMMENTARIES.and_one[Math.floor(Math.random() * COMMENTARIES.and_one.length)];
      commentary = template.replace("[SHOOTER]", shooter.name);
    } else if (isThree) {
      const template = COMMENTARIES.three_success[Math.floor(Math.random() * COMMENTARIES.three_success.length)];
      commentary = template.replace("[SHOOTER]", shooter.name);
    } else {
      const template = COMMENTARIES.two_success[Math.floor(Math.random() * COMMENTARIES.two_success.length)];
      commentary = template.replace("[SHOOTER]", shooter.name);
    }
    
    if (passer) {
      commentary = `(${passer.name} gólpassz) ` + commentary;
    }
    
    return {
      scoreChange: score,
      commentary,
      possessionSwaps: true
    };
  } else {
    // Shot Missed -> Rebound Duel
    const template = COMMENTARIES.miss[Math.floor(Math.random() * COMMENTARIES.miss.length)];
    let commentary = template.replace("[SHOOTER]", shooter.name);
    
    // Foul roll on missed shot (5% chance)
    if (Math.random() < 0.05) {
      const defFouler = selectPlayerByWeight(defendingPlayers, p => 100 - p.defense);
      if (defendingStats[defFouler.id]) defendingStats[defFouler.id].fouls++;
      
      const freeThrowShooter = shooter;
      // Simulate 2 free throws
      const ftPercent = freeThrowShooter.shooting3pt * 0.9; // Free throw is close to 3pt rating + a bit
      let madeFTs = 0;
      if (Math.random() * 100 < ftPercent) madeFTs++;
      if (Math.random() * 100 < ftPercent) madeFTs++;
      
      if (attackingStats[freeThrowShooter.id]) attackingStats[freeThrowShooter.id].points += madeFTs;
      
      commentary += ` Fault! ${defFouler.name} odacsapott. Büntetők jönnek: ${madeFTs}/2 sikeres.`;
      return {
        scoreChange: madeFTs,
        commentary,
        possessionSwaps: true
      };
    }
    
    // Normal rebound duel
    const teamDefRebounding = defendingPlayers.reduce((acc, p) => acc + p.rebounding, 0) / defendingPlayers.length;
    const teamOffRebounding = attackingPlayers.reduce((acc, p) => acc + p.rebounding, 0) / attackingPlayers.length;
    
    // Defense has a big advantage on rebounds (roughly 72% baseline)
    const defReboundChance = 72 + (teamDefRebounding - teamOffRebounding) * 0.2;
    const isDefRebound = Math.random() * 100 < defReboundChance;
    
    const rebounder = isDefRebound
      ? selectPlayerByWeight(defendingPlayers, p => p.rebounding)
      : selectPlayerByWeight(attackingPlayers, p => p.rebounding);
      
    if (isDefRebound) {
      if (defendingStats[rebounder.id]) defendingStats[rebounder.id].rebounds++;
    } else {
      if (attackingStats[rebounder.id]) attackingStats[rebounder.id].rebounds++;
    }
    
    const rebTemplate = COMMENTARIES.rebound[Math.floor(Math.random() * COMMENTARIES.rebound.length)];
    commentary += " " + rebTemplate.replace("[REBOUNDER]", rebounder.name);
    
    return {
      scoreChange: 0,
      commentary,
      possessionSwaps: isDefRebound
    };
  }
}

// Full Instant Match Simulation
export function simulateFullMatch(
  homeTeamId: string,
  awayTeamId: string,
  players: Player[]
): {
  homeScore: number;
  awayScore: number;
  homeStats: Record<string, LiveMatchPlayerStats>;
  awayStats: Record<string, LiveMatchPlayerStats>;
} {
  const homePlayers = players.filter(p => p.teamId === homeTeamId);
  const awayPlayers = players.filter(p => p.teamId === awayTeamId);
  
  const homeStarters = homePlayers.filter(p => p.isStarter);
  const awayStarters = awayPlayers.filter(p => p.isStarter);
  
  // If a team has no starters, auto-assign some
  const getCleanStarters = (teamPlayers: Player[], teamId: string) => {
    if (teamPlayers.filter(p => p.isStarter).length >= 5) {
      return teamPlayers.filter(p => p.isStarter);
    }
    // Take top 5 sorted by OVR
    const sorted = [...teamPlayers].sort((a, b) => b.ovr - a.ovr);
    return sorted.slice(0, 5);
  };
  
  const activeHomeStarters = getCleanStarters(homePlayers, homeTeamId);
  const activeAwayStarters = getCleanStarters(awayPlayers, awayTeamId);
  
  const homeStats = initMatchStats(activeHomeStarters);
  const awayStats = initMatchStats(activeAwayStarters);
  
  let homeScore = 0;
  let awayScore = 0;
  
  // Simulate 4 quarters, about 24-28 possessions per quarter per team
  // Total 100 possessions each roughly
  const totalPossessions = 100 + Math.floor(Math.random() * 12);
  let isHomeAttacking = Math.random() < 0.5;
  
  const tacticsPlaceholder = {
    offenseStyle: 'slow' as const,
    defenseStyle: 'man' as const
  };
  
  for (let p = 0; p < totalPossessions * 2; p++) {
    const attackingPlayers = isHomeAttacking ? activeHomeStarters : activeAwayStarters;
    const defendingPlayers = isHomeAttacking ? activeAwayStarters : activeHomeStarters;
    const attackingTeamId = isHomeAttacking ? homeTeamId : awayTeamId;
    
    const result = simulatePossession(
      attackingTeamId,
      attackingPlayers,
      defendingPlayers,
      homeStats,
      awayStats,
      isHomeAttacking,
      tacticsPlaceholder
    );
    
    if (isHomeAttacking) {
      homeScore += result.scoreChange;
    } else {
      awayScore += result.scoreChange;
    }
    
    if (result.possessionSwaps) {
      isHomeAttacking = !isHomeAttacking;
    }
  }
  
  // Realism safeguard: scores should be in NBA standard range (85 - 135)
  if (homeScore < 70) homeScore += Math.floor(Math.random() * 20) + 15;
  if (awayScore < 70) awayScore += Math.floor(Math.random() * 20) + 15;
  
  // Avoid ties
  if (homeScore === awayScore) {
    if (Math.random() < 0.5) {
      homeScore += 2;
    } else {
      awayScore += 2;
    }
  }
  
  return {
    homeScore,
    awayScore,
    homeStats,
    awayStats
  };
}
