import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, View, Text, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { fetchLeaderboard } from '../api/client';
import { LeaderboardResponse, LeaderboardEntry } from '../types/api';

type TabType = 'overall' | 'pledge' | 'member';

function LeaderboardScreen() {
  const [selectedTab, setSelectedTab] = useState<TabType>('overall');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);

  const loadLeaderboard = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const data = await fetchLeaderboard(selectedTab);
      setLeaderboardData(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboard(false);
  };

  const handleTabPress = (tab: TabType) => {
    setSelectedTab(tab);
  };

  const renderTab = (tab: TabType, label: string) => {
    const isSelected = selectedTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tab, isSelected && styles.tabActive]}
        onPress={() => handleTabPress(tab)}
      >
        <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isTopThree = item.rank <= 3;
    return (
      <View style={styles.entryCard}>
        <Text style={[styles.rankText, isTopThree && styles.rankTextGold]}>
          #{item.rank}
        </Text>
        <View style={styles.entryInfo}>
          <Text style={styles.nameText}>{item.displayName}</Text>
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
        <View style={styles.entryStats}>
          <Text style={styles.pointsText}>{item.points} pts</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={() => loadLeaderboard()} />;
  }

  const entries = leaderboardData?.entries || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>

      <View style={styles.tabBar}>
        {renderTab('overall', 'Overall')}
        {renderTab('pledge', 'Pledge')}
        {renderTab('member', 'Member')}
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No rankings yet</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.gold}
              colors={[Colors.gold]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

export default LeaderboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.gold,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.lightGray,
  },
  tabText: {
    fontSize: 16,
    color: Colors.gray,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.gold,
  },
  listContent: {
    padding: 10,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    width: 50,
  },
  rankTextGold: {
    color: Colors.gold,
  },
  entryInfo: {
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
    color: Colors.gray,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  entryStats: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
  },
});
