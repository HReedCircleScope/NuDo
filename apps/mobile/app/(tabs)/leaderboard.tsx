import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Tiers } from '../../constants/Colors';
import { fetchLeaderboard } from '../../utils/api';

type LeaderboardScope = 'overall' | 'pledge' | 'member';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  tier?: string;
  rank: number;
}

export default function LeaderboardScreen() {
  const [scope, setScope] = useState<LeaderboardScope>('overall');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const result = await fetchLeaderboard(scope);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [scope]);

  const getTierColor = (tier?: string): string => {
    if (!tier) return Tiers.base;
    const lowerTier = tier.toLowerCase();
    if (lowerTier.includes('platinum')) return Tiers.platinum;
    if (lowerTier.includes('gold')) return Tiers.gold;
    if (lowerTier.includes('silver')) return Tiers.silver;
    if (lowerTier.includes('bronze')) return Tiers.bronze;
    return Tiers.base;
  };

  const renderTab = (tabScope: LeaderboardScope, label: string) => {
    const isActive = scope === tabScope;
    return (
      <TouchableOpacity
        style={[styles.tab, isActive && styles.tabActive]}
        onPress={() => setScope(tabScope)}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const rankColor = item.rank <= 3 ? Colors.gold : Colors.white;
    const tierColor = getTierColor(item.tier);

    return (
      <View style={styles.listItem}>
        <Text style={[styles.rank, { color: rankColor }]}>{item.rank}</Text>
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          {item.tier && (
            <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
              <Text style={styles.tierText}>{item.tier}</Text>
            </View>
          )}
        </View>
        <Text style={styles.points}>{item.points} pts</Text>
      </View>
    );
  };

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
          <TouchableOpacity style={styles.retryButton} onPress={() => loadLeaderboard()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Segmented Control */}
      <View style={styles.tabs}>
        {renderTab('overall', 'Overall')}
        {renderTab('pledge', 'Pledge')}
        {renderTab('member', 'Member')}
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={data}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadLeaderboard(true)}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        }
      />
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
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.darkGray,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.gold,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.lightGray,
  },
  tabTextActive: {
    color: Colors.black,
  },
  listContent: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
    width: 40,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black,
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
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
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lightGray,
  },
});
