import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  const [isStudying, setIsStudying] = useState(false);
  const [timer, setTimer] = useState('00:00:00');
  const weeklyMinutes = 0;
  const goalMinutes = 360; // 6 hours

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Timer Display */}
          <Text style={styles.timer}>{timer}</Text>

          {/* Start Study Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setIsStudying(!isStudying)}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>
              {isStudying ? 'Stop Study' : 'Start Study'}
            </Text>
          </TouchableOpacity>

          {/* Current Zone */}
          <Text style={styles.zoneText}>Current Zone: Not in zone</Text>

          {/* Weekly Progress Section */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Weekly Progress</Text>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(weeklyMinutes / goalMinutes) * 100}%` },
                ]}
              />
            </View>

            {/* Progress Label */}
            <Text style={styles.progressLabel}>
              This Week: {weeklyMinutes} / {goalMinutes} min
            </Text>
          </View>

          {/* Bonus Callout */}
          <View style={styles.bonusCallout}>
            <Text style={styles.bonusText}>
              Next bonus: 6 hours (+25 pts)
            </Text>
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
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 8,
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
  },
  zoneText: {
    fontSize: 16,
    color: Colors.lightGray,
    marginBottom: 40,
  },
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
  },
  progressLabel: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
  },
  bonusCallout: {
    width: '100%',
    backgroundColor: Colors.gold + '20',
    borderColor: Colors.gold,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  bonusText: {
    fontSize: 16,
    color: Colors.gold,
    textAlign: 'center',
    fontWeight: '600',
  },
});
