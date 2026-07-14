import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Camera } from "expo-camera";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";

const FEATURES = [
  { icon: "location" as const, text: "Precise GPS coordinates & altitude" },
  { icon: "map" as const, text: "Auto-reverse geocoded address" },
  { icon: "camera" as const, text: "Geotagged photos" },
  { icon: "images" as const, text: "Saved directly to your gallery" },
];

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(false);

  async function handleGetStarted() {
    setLoading(true);
    try {
      const [cam, loc] = await Promise.all([
        Camera.getCameraPermissionsAsync().catch(() => ({ granted: false })),
        Location.getForegroundPermissionsAsync().catch(() => ({
          granted: false,
        })),
      ]);
      // writeOnly: true — we only save photos, never read the library
      // On Android 10+ this returns granted:true without a dialog (scoped storage)
      const med = await MediaLibrary.getPermissionsAsync(true).catch(() => ({
        granted: false,
      }));

      if (cam.granted && loc.granted && med.granted) {
        router.replace("/camera");
        return;
      }

      // Find the first missing permission step
      let start = 0;
      if (loc.granted && !cam.granted) start = 1;
      else if (loc.granted && cam.granted && !med.granted) start = 2;

      router.replace({
        pathname: "/permissions",
        params: { start: String(start) },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Top spacer */}
        <View style={{ flex: 0.4 }} />

        {/* Small logo mark */}
        <View style={styles.logoMark}>
          <Ionicons name="location" size={26} color="#3244C2" />
        </View>

        {/* Preview mockup with soft color blobs behind it */}
        <View style={styles.previewArea}>
          <View style={[styles.blob, styles.blobOne]} />
          <View style={[styles.blob, styles.blobTwo]} />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>GeoSnap</Text>

            <View style={styles.cardRows}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.cardRow}>
                  <View style={styles.cardRowIcon}>
                    <Ionicons name={f.icon} size={14} color="#3244C2" />
                  </View>
                  <Text style={styles.cardRowText} numberOfLines={1}>
                    {f.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Fade the last row into the card, like a peek at more content */}
            <LinearGradient
              colors={["rgba(255,255,255,0)", "#FFFFFF"]}
              style={styles.cardFade}
              pointerEvents="none"
            />
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Headline + subtitle */}
        <View style={styles.textArea}>
          <Text style={styles.title}>GeoSnap</Text>
          <Text style={styles.subtitle}>
            Capture photos with your exact GPS location, address, and time
            embedded automatically.
          </Text>
        </View>

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
              <Text style={styles.getStartedText}>Get Started</Text>
            )}
          </TouchableOpacity>

          {/* Pagination dots */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F7FB" },
  safe: { flex: 1, paddingHorizontal: 28, alignItems: "center" },

  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF1FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#3244C2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },

  previewArea: {
    width: "100%",
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobOne: {
    width: 230,
    height: 230,
    backgroundColor: "#3244C2",
    opacity: 0.12,
    top: -10,
    left: -10,
  },
  blobTwo: {
    width: 180,
    height: 180,
    backgroundColor: "#F472B6",
    opacity: 0.12,
    bottom: -10,
    right: -10,
  },

  card: {
    width: 272,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    overflow: "hidden",
    shadowColor: "#0B0D1A",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  cardRows: { gap: 10 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardRowIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#EEF1FD",
    justifyContent: "center",
    alignItems: "center",
  },
  cardRowText: { fontSize: 11.5, color: "#4B4B4B", fontWeight: "500", flex: 1 },
  cardFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 30,
  },

  textArea: { alignItems: "center", marginBottom: 28 },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111111",
    textAlign: "center",
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    color: "#6E6E6E",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    fontWeight: "500",
  },

  bottomArea: { width: "100%", paddingBottom: 8, alignItems: "center" },
  getStartedBtn: {
    width: "100%",
    backgroundColor: "#3244C2",
    borderRadius: 28,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  dotsRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D8DCE8" },
  dotActive: { width: 18, backgroundColor: "#3244C2" },
});
