import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function ProfileScreen() {
  // Placeholder data
  const userName = 'User Name';
  const userInitials = 'UN';
  const totalHours = 0;
  const thisWeekMinutes = 0;
  const streakWeeks = 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={32}
              color={Colors.gold}
            />
            <Text style={styles.statValue}>{totalHours} hrs</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="calendar-week"
              size={32}
              color={Colors.gold}
            />
            <Text style={styles.statValue}>{thisWeekMinutes} min</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="fire"
              size={32}
              color={Colors.gold}
            />
            <Text style={styles.statValue}>{streakWeeks} weeks</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Recent Sessions Section */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={48}
              color={Colors.lightGray}
            />
            <Text style={styles.emptyText}>No recent sessions</Text>
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
  scrollContent: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.black,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: Colors.darkGray,
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray + '40',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightGray,
    marginTop: 12,
  },
});
