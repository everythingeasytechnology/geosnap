import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';

const FEATURES = [
  { icon: 'location' as const, text: 'Precise GPS coordinates & altitude' },
  { icon: 'map' as const, text: 'Auto-reverse geocoded address' },
  { icon: 'camera' as const, text: 'Geotagged photos & videos' },
  { icon: 'images' as const, text: 'Saved directly to your gallery' },
];

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(false);

  async function handleGetStarted() {
    setLoading(true);
    try {
      const [cam, loc] = await Promise.all([
        Camera.getCameraPermissionsAsync().catch(() => ({ granted: false })),
        Location.getForegroundPermissionsAsync().catch(() => ({ granted: false })),
      ]);
      // writeOnly: true — we only save photos, never read the library
      // On Android 10+ this returns granted:true without a dialog (scoped storage)
      const med = await MediaLibrary.getPermissionsAsync(true).catch(() => ({ granted: false }));

      if (cam.granted && loc.granted && med.granted) {
        router.replace('/camera');
        return;
      }

      // Find the first missing permission step
      let start = 0;
      if (loc.granted && !cam.granted) start = 1;
      else if (loc.granted && cam.granted && !med.granted) start = 2;

      router.replace({ pathname: '/permissions', params: { start: String(start) } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top spacer */}
        <View style={{ flex: 0.5 }} />

        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Ionicons name="location" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>GeoSnap</Text>
          <Text style={styles.tagline}>Capture the moment.{'\n'}Record the place.</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon} size={17} color="#3244C2" />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* CTA */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={handleGetStarted}
            activeOpacity={0.88}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.getStartedText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <Ionicons name="location" size={12} color="#3244C2" />
            <Text style={styles.brandText}>GeoSnap GPS Camera</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1, paddingHorizontal: 28 },

  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#3244C2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3244C2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 12,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 17,
    color: '#6E6E6E',
    textAlign: 'center',
    lineHeight: 25,
    fontWeight: '500',
  },

  featuresCard: {
    backgroundColor: '#F5F7FF',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#EEF1FD',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF1FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: { fontSize: 14, color: '#2B2B2B', fontWeight: '500', flex: 1 },

  bottomArea: { paddingBottom: 4, gap: 16, alignItems: 'center' },
  getStartedBtn: {
    width: '100%',
    backgroundColor: '#3244C2',
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#3244C2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  getStartedText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  brandText: { fontSize: 12, color: '#ADBAF0', fontWeight: '600' },
});
