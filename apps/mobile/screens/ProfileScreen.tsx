import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export function ProfileScreen() {
  const handleSettingsPress = () => {
    console.log('Settings pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>TU</Text>
          </View>
        </View>

        <Text style={styles.userName}>Test User</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>YTD Hours</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>0 min</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        <View style={styles.sessionsSection}>
          <Text style={styles.sectionHeader}>Recent Sessions</Text>
          <Text style={styles.placeholderText}>No sessions yet</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.black,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    padding: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gold,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.white,
  },
  sessionsSection: {
    width: '100%',
    marginBottom: 40,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 15,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 20,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  settingsButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
