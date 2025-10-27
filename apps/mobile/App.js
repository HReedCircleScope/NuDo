import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet,
  AppState, Platform, ToastAndroid, Alert
} from 'react-native';
import * as Location from 'expo-location';

/** Android emulator -> host machine */
const API_BASE = 'http://10.0.2.2:3000';
const USER_ID = 'hudson-demo';

const CHECK_MS = 5 * 60 * 1000; // 5 minutes

async function j(res) {
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

const api = {
  zones: () => fetch(`${API_BASE}/zones`).then(j),
  start: (userId, zoneId) =>
    fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, zoneId }),
    }).then(j),
  stop: (sessionId) =>
    fetch(`${API_BASE}/sessions/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    }).then(j),
  weekly: (userId) =>
    fetch(`${API_BASE}/stats/weekly?userId=${encodeURIComponent(userId)}`).then(j),
};

function notify(title, body) {
  if (Platform.OS === 'android' && ToastAndroid?.show) {
    ToastAndroid.show(`${title}: ${body}`, ToastAndroid.LONG);
  } else {
    Alert.alert(title, body);
  }
}

// Haversine distance in meters
function distMeters(a, b) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function App() {
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // debug info
  const [pos, setPos] = useState(null);
  const [lastDistance, setLastDistance] = useState(null);
  const [lastRadius, setLastRadius] = useState(null);
  const [lastCheckAt, setLastCheckAt] = useState(null);

  const stoppingRef = useRef(false);
  const intervalRef = useRef(null);

  // Load zones + weekly + ask for location permission once
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
      if (status !== 'granted') {
        setErr('Location permission not granted. Enable it in Settings → Apps → Expo Go → Permissions.');
      }
      // Optional: make sure location services are on
      const services = await Location.hasServicesEnabledAsync().catch(() => false);
      if (!services) {
        notify('Location off', 'Turn on location services in emulator settings.');
      }
    })();

    api.zones()
      .then((z) => {
        const active = (z || []).filter((x) => x.isActive);
        if (!mounted) return;
        setZones(active);
        if (active[0]?._id) setZoneId(active[0]._id);
      })
      .catch((e) => setErr(String(e)));

    api.weekly(USER_ID)
      .then((w) => mounted && setWeekly(w))
      .catch(() => {});

    // Auto-stop when app backgrounded/closed
    const sub = AppState.addEventListener('change', async (state) => {
      if ((state === 'background' || state === 'inactive') && sessionId && !stoppingRef.current) {
        stoppingRef.current = true;
        try {
          const res = await api.stop(sessionId);
          setSessionId(null);
          setWeekly({ minutes: res.minutes, weekStart: res.weekStart });
          notify('Study session stopped', `Logged ${res.durationMin ?? 0} min. This week: ${res.minutes ?? 0} min.`);
        } catch {
          notify('NuDo', 'Could not stop session on background transition.');
        } finally {
          stoppingRef.current = false;
        }
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [sessionId]);

 // The actual location check logic (robust: lastKnown first, then current with timeout)
// Force a live GPS read (ignore last-known) with a timeout + debug
const checkStillInside = async () => {
  const z = zones.find((zz) => zz._id === zoneId);
  setErr('');

  try {
    const getPos = Location.getCurrentPositionAsync({
      accuracy: Location.LocationAccuracy.High, // more reliable on emulator
      mayShowUserSettingsDialog: false,
    });
    const withTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Location timeout (no fresh fix)')), 12000)
    );
    const posNow = await Promise.race([getPos, withTimeout]);

    const here = { lat: posNow.coords.latitude, lng: posNow.coords.longitude };
    setPos(here);

    const zSel = z ?? zones.find((zz) => zz._id === zoneId);
    if (!zSel) {
      setLastDistance(null);
      setLastRadius(null);
      setLastCheckAt(new Date().toLocaleTimeString());
      return;
    }

    const center = { lat: zSel.lat, lng: zSel.lng };
    const d = distMeters(here, center);
    const radius = (zSel.radiusMeters ?? 0) + 15; // 15m buffer

    setLastDistance(Math.round(d));
    setLastRadius(Math.round(radius));
    setLastCheckAt(new Date().toLocaleTimeString());

    if (sessionId && d > radius && !stoppingRef.current) {
      stoppingRef.current = true;
      try {
        const res = await api.stop(sessionId);
        setSessionId(null);
        setWeekly({ minutes: res.minutes, weekStart: res.weekStart });
        notify('Stopped (left zone)', `Logged ${res.durationMin ?? 0} min. This week: ${res.minutes ?? 0} min.`);
      } catch {
        notify('NuDo', 'Tried to stop after leaving zone, but API failed.');
      } finally {
        stoppingRef.current = false;
      }
    }
  } catch (e) {
    setErr(`Location error: ${String(e?.message || e)}`);
  }
};

  // While a session is active, check every CHECK_MS
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!sessionId) return;

    // Run one immediately, then schedule repeats
    checkStillInside();
    intervalRef.current = setInterval(checkStillInside, CHECK_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, zoneId, zones]);

  const canStart = useMemo(() => !!zoneId && !sessionId && !loading, [zoneId, sessionId, loading]);
  const canStop = useMemo(() => !!sessionId && !loading, [sessionId, loading]);

  const onStart = async () => {
    if (!zoneId) return;
    setLoading(true);
    setErr('');
    try {
      const res = await api.start(USER_ID, zoneId);
      setSessionId(res.sessionId); // { sessionId, startAt }
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onStop = async () => {
    if (!sessionId) return;
    setLoading(true);
    setErr('');
    try {
      const res = await api.stop(sessionId);
      setSessionId(null);
      setWeekly({ minutes: res.minutes, weekStart: res.weekStart });
      notify('Study session stopped', `Logged ${res.durationMin ?? 0} min. This week: ${res.minutes ?? 0} min.`);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>NuDo — Study Sessions</Text>

      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Zone</Text>
        <Text style={styles.value}>
          {zones.find((z) => z._id === zoneId)?.name ?? 'Loading…'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.row}>
          <Pressable
            disabled={!canStart}
            onPress={onStart}
            style={[styles.btn, { backgroundColor: canStart ? '#0a7d3b' : '#aaa' }]}
          >
            <Text style={styles.btnText}>Start</Text>
          </Pressable>
          <Pressable
            disabled={!canStop}
            onPress={onStop}
            style={[styles.btn, { backgroundColor: canStop ? '#b91c1c' : '#aaa' }]}
          >
            <Text style={styles.btnText}>Stop</Text>
          </Pressable>
        </View>
      )}

{/* Debug: why can't I start? + quick reset */}
<View style={{ marginTop: 10, gap: 6 }}>
  <Text style={{ fontSize: 12, color: '#666' }}>
    canStart={String(canStart)} | zoneId={String(!!zoneId)} | sessionId={String(!!sessionId)} | loading={String(loading)}
  </Text>

  <Pressable
    onPress={() => { setSessionId(null); setLoading(false); setErr(''); }}
    style={[styles.btn, { backgroundColor: '#6b7280', alignSelf: 'flex-start' }]}
  >
    <Text style={styles.btnText}>Reset session state</Text>
  </Pressable>
</View>

      {/* Debug / manual check */}
      <View style={{ marginTop: 16, gap: 8 }}>
        <Pressable
          onPress={checkStillInside}
          style={[styles.btn, { backgroundColor: '#2563eb' }]}
        >
          <Text style={styles.btnText}>Check now (distance)</Text>
        </Pressable>
        <Text style={styles.value}>
          Last check: {lastCheckAt ?? '—'}
        </Text>
        <Text style={styles.value}>
          Pos: {pos ? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : '—'}
        </Text>
        <Text style={styles.value}>
          Distance: {lastDistance ?? '—'} m • Radius: {lastRadius ?? '—'} m
        </Text>
      </View>

      {!!err && <Text style={{ color: '#b91c1c', marginTop: 12 }}>{err}</Text>}
      <Text style={{ color: '#666', marginTop: 20, fontSize: 12 }}>API: {API_BASE}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 16 },
  h1: { fontSize: 24, fontWeight: '900' },
  label: { fontSize: 18, fontWeight: '600' },
  value: { fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { padding: 14, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: '800' },
});