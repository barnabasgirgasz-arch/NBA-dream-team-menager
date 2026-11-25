import { ScheduleItem } from '../types';

export function generateSchedule(teamIds: string[]): ScheduleItem[] {
  const numTeams = teamIds.length;
  const schedule: ScheduleItem[] = [];
  
  // Clone the team list to rotate
  const teams = [...teamIds];
  
  // 8 teams => 7 rounds for single round-robin
  // We'll do a double round-robin (14 rounds total: 7 home, 7 away)
  let scheduleId = 1;
  
  for (let round = 1; round <= (numTeams - 1) * 2; round++) {
    const isSecondHalf = round > (numTeams - 1);
    const effectiveRound = isSecondHalf ? round - (numTeams - 1) : round;
    
    for (let i = 0; i < numTeams / 2; i++) {
      const homeIdx = i;
      const awayIdx = numTeams - 1 - i;
      
      let home = teams[homeIdx];
      let away = teams[awayIdx];
      
      // Swap home/away for the second half of the season
      if (isSecondHalf) {
        const temp = home;
        home = away;
        away = temp;
      } else if (round % 2 === 0) {
        // Swap home/away alternately to balance home/away games
        const temp = home;
        home = away;
        away = temp;
      }
      
      schedule.push({
        id: `match_${scheduleId++}`,
        round,
        homeTeamId: home,
        awayTeamId: away,
        played: false,
      });
    }
    
    // Rotate teams (keep the first one fixed)
    const first = teams[0];
    const rest = teams.slice(1);
    const last = rest.pop()!;
    teams.length = 0;
    teams.push(first, last, ...rest);
  }
  
  // Sort schedule by round
  return schedule.sort((a, b) => a.round - b.round);
}
