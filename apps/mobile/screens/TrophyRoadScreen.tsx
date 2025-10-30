import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { fetchSeasonProgress } from '../api/client';
import { SeasonProgress } from '../types/api';

function TrophyRoadScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonProgress, setSeasonProgress] = useState<SeasonProgress | null>(null);

  const loadSeasonProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSeasonProgress('test-user-123');
      setSeasonProgress(data);
    } catch (err) {
      setError('Failed to load season progress');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeasonProgress();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadSeasonProgress} />;
  }

  const ytdHours = seasonProgress ? (seasonProgress.ytdMinutes / 60).toFixed(1) : '0.0';
  const currentMilestone = seasonProgress?.currentMilestoneIndex || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.header}>Trophy Road</Text>

        <View style={styles.statsSection}>
          <Text style={styles.label}>Year-to-Date Hours</Text>
          <Text style={styles.ytdHours}>{ytdHours}</Text>
        </View>

        <View style={styles.milestoneSection}>
          <Text style={styles.label}>Current Milestone</Text>
          <Text style={styles.milestoneNumber}>{currentMilestone}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default TrophyRoadScreen;

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
    marginTop: 60,
    marginBottom: 40,
  },
  statsSection: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  milestoneSection: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: 10,
  },
  ytdHours: {
    fontSize: 56,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  milestoneNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
