import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, View, Text, RefreshControl, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { fetchZones } from '../api/client';
import { Zone } from '../types/api';

function MapScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);

  const loadZones = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const data = await fetchZones();
      setZones(data);
    } catch (err) {
      setError('Failed to load zones');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadZones(false);
  };

  const renderZone = ({ item }: { item: Zone }) => {
    return (
      <View style={styles.zoneCard}>
        <Text style={styles.zoneName}>{item.name}</Text>
        <Text style={styles.zoneRadius}>{item.radiusMeters} meters radius</Text>
        <Text style={[
          styles.zoneStatus,
          item.isActive ? styles.statusActive : styles.statusInactive
        ]}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} onRetry={() => loadZones()} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Zones</Text>
      </View>

      {zones.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No zones found</Text>
        </View>
      ) : (
        <FlatList
          data={zones}
          renderItem={renderZone}
          keyExtractor={(item) => item._id}
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

export default MapScreen;

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
  listContent: {
    padding: 15,
  },
  zoneCard: {
    backgroundColor: Colors.lightGray,
    padding: 20,
    marginBottom: 15,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  zoneName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  zoneRadius: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 8,
  },
  zoneStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusActive: {
    color: Colors.gold,
  },
  statusInactive: {
    color: Colors.gray,
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
