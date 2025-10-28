import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { fetchTrophyProgress } from '../../utils/api';

interface TrophyProgress {
  userId: string;
  totalMinutes: number;
  totalHours: number;
  tier: number;
  tierLabel: string;
  currentMilestone: number;
  nextMilestone?: number;
  nextMilestoneMinutes?: number;
  progressToNext: number;
  milestones: Array<{
    number: number;
    minutes: number;
    completed: boolean;
  }>;
}

export default function TrophyScreen() {
  const [data, setData] = useState<TrophyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a fallback userId for now
  const userId = 'fallback-user';

  const loadTrophyProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchTrophyProgress(userId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trophy progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrophyProgress();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTrophyProgress}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No trophy data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Trophy Road</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <Text style={styles.yearToDate}>Year-to-Date</Text>
          <Text style={styles.hoursValue}>{data.totalHours.toFixed(1)} hours</Text>
          <Text style={styles.tierLabel}>Tier {data.tierLabel}</Text>
          <Text style={styles.milestoneLabel}>
            Milestone {data.currentMilestone}
          </Text>
        </View>

        {/* Progress to Next Milestone */}
        {data.nextMilestone && data.nextMilestoneMinutes && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Next Milestone</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${data.progressToNext * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((1 - data.progressToNext) * data.nextMilestoneMinutes)} minutes to
              Milestone {data.nextMilestone}
            </Text>
          </View>
        )}

        {/* Milestone Visualization */}
        <View style={styles.milestonesSection}>
          <Text style={styles.milestonesTitle}>Milestones</Text>
          <View style={styles.milestonesContainer}>
            {data.milestones.map((milestone) => (
              <View key={milestone.number} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneCircle,
                    milestone.completed && styles.milestoneCircleCompleted,
                    milestone.number === data.currentMilestone &&
                      styles.milestoneCircleCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.milestoneNumber,
                      milestone.completed && styles.milestoneNumberCompleted,
                    ]}
                  >
                    {milestone.number}
                  </Text>
                </View>
                <Text style={styles.milestoneMinutes}>
                  {(milestone.minutes / 60).toFixed(0)}h
                </Text>
              </View>
            ))}
          </View>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  yearToDate: {
    fontSize: 16,
    color: Colors.lightGray,
    marginBottom: 8,
  },
  hoursValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.gold,
    marginBottom: 12,
  },
  tierLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  milestoneLabel: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  progressCard: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 16,
    backgroundColor: Colors.black,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
  },
  progressText: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  milestonesSection: {
    marginTop: 8,
  },
  milestonesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  milestonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  milestoneItem: {
    alignItems: 'center',
  },
  milestoneCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.darkGray,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneCircleCompleted: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  milestoneCircleCurrent: {
    borderColor: Colors.gold,
    borderWidth: 3,
  },
  milestoneNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.lightGray,
  },
  milestoneNumberCompleted: {
    color: Colors.black,
  },
  milestoneMinutes: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightGray,
  },
});
