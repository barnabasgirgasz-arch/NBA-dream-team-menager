import { Player } from '../types';

/**
 * Calculates the buyout / transfer fee required to acquire a player.
 * Free agents are completely free to sign ($0M transfer fee).
 * Contracted players have a buyout clause based on their OVR rating and salary.
 */
export function calculateBuyoutPrice(player: Player): number {
  if (player.teamId === 'free_agent') {
    return 0; // Free transfer
  }

  // Base multiplier on OVR rating
  let basePrice = 8;
  if (player.ovr >= 96) {
    basePrice = 46.0;
  } else if (player.ovr >= 93) {
    basePrice = 38.0;
  } else if (player.ovr >= 90) {
    basePrice = 30.0;
  } else if (player.ovr >= 86) {
    basePrice = 22.0;
  } else if (player.ovr >= 82) {
    basePrice = 16.0;
  } else if (player.ovr >= 78) {
    basePrice = 10.5;
  } else {
    basePrice = 6.0;
  }

  // Factor in player salary proportion (higher paid players command modest contract compensation)
  const salaryWeight = Math.round(player.salary * 0.25 * 10) / 10;
  const totalPrice = Math.round((basePrice + salaryWeight) * 10) / 10;
  return totalPrice;
}

export function formatMillions(amount: number): string {
  return `$${amount.toFixed(1)}M`;
}
