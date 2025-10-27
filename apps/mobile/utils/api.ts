import { BASE_URL } from '../config/api';

export async function fetchLeaderboard(scope: 'overall' | 'pledge' | 'member') {
  const response = await fetch(`${BASE_URL}/leaderboard?scope=${scope}`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}

export async function fetchTrophyProgress(userId: string) {
  const response = await fetch(`${BASE_URL}/season/progress?userId=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch trophy progress');
  return response.json();
}

export async function fetchZones() {
  const response = await fetch(`${BASE_URL}/zones`);
  if (!response.ok) throw new Error('Failed to fetch zones');
  return response.json();
}

export async function fetchWeeklyStats(userId: string) {
  const response = await fetch(`${BASE_URL}/stats/weekly?userId=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch weekly stats');
  return response.json();
}
