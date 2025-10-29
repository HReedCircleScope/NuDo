import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { fetchWeeklyStats } from '../api/client';
import { WeeklyStats } from '../types/api';

export function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);

  const loadWeeklyStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWeeklyStats('test-user-123');
      setWeeklyStats(data);
    } catch (err) {
      setError('Failed to load weekly stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeeklyStats();
  }, []);

  const handleStartStudy = () => {
    console.log('Start Study');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadWeeklyStats} />;
  }

  const minutes = weeklyStats?.minutes || 0;
  const goalMinutes = 360; // 6 hours

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.header}>Weekly Progress</Text>

        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {minutes} / {goalMinutes} minutes
          </Text>
        </View>

        <View style={styles.timerSection}>
          <Text style={styles.timerText}>00:00:00</Text>
        </View>

        <View style={styles.buttonSection}>
          <Button title="Start Study" onPress={handleStartStudy} />
        </View>

        <View style={styles.zoneSection}>
          <Text style={styles.zoneText}>Not in zone</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.gold,
    marginTop: 20,
    marginBottom: 30,
  },
  progressSection: {
    marginBottom: 40,
  },
  progressText: {
    fontSize: 20,
    color: Colors.white,
    textAlign: 'center',
  },
  timerSection: {
    marginBottom: 30,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 2,
  },
  buttonSection: {
    marginBottom: 30,
    width: '100%',
  },
  zoneSection: {
    marginTop: 20,
  },
  zoneText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
  },
});
