import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../../constants/Colors';
import { fetchWeeklyStats } from '../../utils/api';

export default function HomeScreen() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = 'test-user-123';
  const weeklyGoalHours = 6;

  useEffect(() => {
    loadWeeklyStats();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive]);

  async function loadWeeklyStats() {
    try {
      const stats = await fetchWeeklyStats(userId);
      setWeeklyMinutes(stats.minutes || 0);
    } catch (error) {
      console.error('Failed to load weekly stats:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSession() {
    if (sessionActive) {
      setSessionActive(false);
      setSessionTime(0);
      loadWeeklyStats();
    } else {
      setSessionActive(true);
      setSessionTime(0);
    }
  }

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const weeklyProgress = Math.min((weeklyMinutes / (weeklyGoalHours * 60)) * 100, 100);
  const weeklyHours = (weeklyMinutes / 60).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>NuDo</Text>

        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{formatTime(sessionTime)}</Text>
          <Text style={styles.timerLabel}>
            {sessionActive ? 'Session In Progress' : 'Ready to Study'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, sessionActive && styles.buttonActive]}
          onPress={toggleSession}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {sessionActive ? 'STOP SESSION' : 'START SESSION'}
          </Text>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>This Week</Text>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${weeklyProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {weeklyHours}h / {weeklyGoalHours}h
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{weeklyMinutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.floor(weeklyProgress)}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.gold,
    marginTop: 20,
    marginBottom: 40,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timer: {
    fontSize: 56,
    fontWeight: 'bold',
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: Colors.lightGray,
    marginTop: 8,
  },
  button: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 60,
    paddingVertical: 24,
    borderRadius: 16,
    marginBottom: 40,
    elevation: 4,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonActive: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    letterSpacing: 1,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: Colors.darkGray,
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
  },
  progressText: {
    fontSize: 14,
    color: Colors.white,
    marginTop: 8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.lightGray,
    marginTop: 4,
  },
});
