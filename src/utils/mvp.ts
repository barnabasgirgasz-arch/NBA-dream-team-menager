import { Player } from '../types';

/**
 * Calculates a player's Season MVP performance index (PPG + RPG + APG).
 */
export function getPlayerMvpScore(player: Player): number {
  return player.stats.ppg + player.stats.rpg + player.stats.apg;
}

/**
 * Finds the player across the league with the highest season-average
 * performance stats (PPG + RPG + APG) among players who played at least 1 game.
 */
export function calculateSeasonMVP(players: Player[]): Player | null {
  const eligiblePlayers = players.filter((p) => p.stats.gamesPlayed > 0);
  if (eligiblePlayers.length === 0) return null;

  return [...eligiblePlayers].sort((a, b) => {
    const scoreDiff = getPlayerMvpScore(b) - getPlayerMvpScore(a);
    if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;

    // Tie-breakers: higher PPG, then higher OVR, then more games played
    if (b.stats.ppg !== a.stats.ppg) return b.stats.ppg - a.stats.ppg;
    if (b.ovr !== a.ovr) return b.ovr - a.ovr;
    return b.stats.gamesPlayed - a.stats.gamesPlayed;
  })[0];
}

/**
 * Returns top MVP candidates sorted by (PPG + RPG + APG) descending.
 */
export function getMvpLeaderboard(players: Player[], limit = 5): Player[] {
  return players
    .filter((p) => p.stats.gamesPlayed > 0)
    .sort((a, b) => {
      const scoreDiff = getPlayerMvpScore(b) - getPlayerMvpScore(a);
      if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;
      if (b.stats.ppg !== a.stats.ppg) return b.stats.ppg - a.stats.ppg;
      return b.ovr - a.ovr;
    })
    .slice(0, limit);
}
