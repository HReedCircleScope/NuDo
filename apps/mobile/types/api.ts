/**
 * Leaderboard entry for a single user
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  role: string;
  minutes: number;
  points: number;
  tier: string;
}

/**
 * Leaderboard response from /leaderboard endpoint
 */
export interface LeaderboardResponse {
  weekStart: string;
  scope: string;
  entries: LeaderboardEntry[];
}

/**
 * Study zone information
 */
export interface Zone {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  isActive: boolean;
}

/**
 * Weekly statistics for a user
 */
export interface WeeklyStats {
  userId: string;
  weekStart: string;
  minutes: number;
  points: number;
}

/**
 * Season progress for Trophy Road
 */
export interface SeasonProgress {
  userId: string;
  ytdMinutes: number;
  currentMilestoneIndex: number;
}
