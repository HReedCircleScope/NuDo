import axios from 'axios';
import { Platform } from 'react-native';

// Platform-specific base URL
const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000'
  : 'http://10.134.180.90:3000';

// Create axios instance with configuration
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch leaderboard data
 * @param scope - 'overall' | 'pledge' | 'member'
 */
export async function fetchLeaderboard(scope: string) {
  try {
    const response = await apiClient.get(`/leaderboard?scope=${scope}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}

/**
 * Fetch all zones
 */
export async function fetchZones() {
  try {
    const response = await apiClient.get('/zones');
    return response.data;
  } catch (error) {
    console.error('Error fetching zones:', error);
    throw error;
  }
}

/**
 * Fetch weekly stats for a user
 * @param userId - User ID
 */
export async function fetchWeeklyStats(userId: string) {
  try {
    const response = await apiClient.get(`/stats/weekly?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    throw error;
  }
}

/**
 * Fetch season progress for a user
 * @param userId - User ID
 */
export async function fetchSeasonProgress(userId: string) {
  try {
    const response = await apiClient.get(`/season/progress?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching season progress:', error);
    throw error;
  }
}
