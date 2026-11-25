export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export interface Player {
  id: string;
  name: string;
  position: Position;
  ovr: number;
  // Attributes (0-99)
  shooting3pt: number;
  pointsInside: number;
  playmaking: number;
  rebounding: number;
  defense: number;
  stamina: number;
  
  // Contract
  salary: number; // in millions of dollars, e.g. 45 for $45,000,000
  
  // Current Team association
  teamId: string; // 'free_agent' or team ID
  isStarter: boolean;
  
  // Career/Season stats in this simulation
  stats: {
    ppg: number; // Points Per Game
    rpg: number; // Rebounds Per Game
    apg: number; // Assists Per Game
    bpg: number; // Blocks Per Game
    spg: number; // Steals Per Game
    gamesPlayed: number;
  };
}

export interface Team {
  id: string;
  name: string;
  city: string;
  logo: string; // Lucide icon name or emoji
  color: string; // Tailwind color class or hex code
  secondaryColor: string;
  isUser: boolean;
  budget: number; // Remaining budget in millions (Salary Cap: $140M)
  cashBudget?: number; // Club liquid cash funds for player buyouts & signings (e.g. $70M)
  gmName: string;
  gmPersonality: 'greedy' | 'fair' | 'aggressive' | 'analyst';
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
}

export interface TradeOffer {
  id: string;
  senderTeamId: string;
  receiverTeamId: string;
  senderPlayerIds: string[];
  receiverPlayerIds: string[];
  cashTransfer?: number; // positive means sender gives cash, negative means receiver gives cash
  status: 'pending' | 'accepted' | 'declined' | 'counter';
  message: string;
}

export interface LiveMatchPlayerStats {
  playerId: string;
  name: string;
  position: Position;
  points: number;
  rebounds: number;
  assists: number;
  blocks: number;
  steals: number;
  fouls: number;
  turnovers: number;
}

export interface LiveMatchState {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  quarter: number; // 1, 2, 3, 4
  timeRemaining: number; // in seconds (e.g. 720 per quarter, or fast-forwarded 180s per quarter)
  ticker: string[]; // match event logs
  isLive: boolean;
  isPaused: boolean;
  speed: number; // 1, 2, 4 (speed multiplier) or 0 (instant)
  homeStats: Record<string, LiveMatchPlayerStats>; // player id -> stats
  awayStats: Record<string, LiveMatchPlayerStats>;
  possession: 'home' | 'away';
  lastPlayTime: number;
}

export interface ScheduleItem {
  id: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
}

export interface SeasonSettings {
  round: number;
  totalRounds: number;
  draftCompleted: boolean;
  salaryCap: number; // e.g. 140 ($140M)
  isCompleted?: boolean;
  mvpPlayerId?: string | null;
}
