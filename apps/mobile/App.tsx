import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:3000';

const Colors = {
  gold: '#FFC107',
  black: '#111111',
  white: '#FFFFFF',
  darkGray: '#333333',
};

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
  tier: string;
  role: string;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/leaderboard?scope=overall`);
      setLeaderboard(response.data.entries || []);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLeaderboard}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NuDo Leaderboard</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {leaderboard.map((entry, index) => (
          <View key={entry.userId || index} style={styles.entryCard}>
            <View style={styles.rankContainer}>
              <Text style={[
                styles.rankText,
                entry.rank <= 3 && styles.topRankText
              ]}>
                #{entry.rank}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.nameText}>{entry.displayName}</Text>
              <Text style={styles.roleText}>{entry.role}</Text>
            </View>
            <View style={styles.statsContainer}>
              <Text style={styles.pointsText}>{entry.points} pts</Text>
              <Text style={styles.tierText}>{entry.tier}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingTop: 50,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.gold,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    color: Colors.white,
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  topRankText: {
    color: Colors.gold,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  roleText: {
    fontSize: 14,
    color: '#888',
    textTransform: 'capitalize',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  tierText: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
});
