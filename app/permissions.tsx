import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Camera } from "expo-camera";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";

const STEPS: {
  key: "location" | "camera" | "media";
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  btnLabel: string;
  color: string;
}[] = [
  {
    key: "location",
    icon: "location",
    title: "Enable Location",
    subtitle: "GPS Geotagging",
    description:
      "GeoSnap automatically embeds precise GPS coordinates and your current address into every photo you capture.",
    btnLabel: "Allow Location Access",
    color: "#3244C2",
  },
  {
    key: "camera",
    icon: "camera",
    title: "Enable Camera",
    subtitle: "Photo Capture",
    description: "Access your camera to capture geotagged photos.",
    btnLabel: "Allow Camera Access",
    color: "#3244C2",
  },
  {
    key: "media",
    icon: "images",
    title: "Enable Photo Library",
    subtitle: "Save to Gallery",
    description:
      "Save your geotagged captures directly to your device gallery so you always have a record of where and when.",
    btnLabel: "Allow Photo Library",
    color: "#3244C2",
  },
];

export default function PermissionsScreen() {
  const params = useLocalSearchParams<{ start?: string }>();
  const initialStep = Math.min(
    Math.max(parseInt(params.start ?? "0") || 0, 0),
    STEPS.length - 1,
  );

  const [currentStep, setCurrentStep] = useState(initialStep);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  async function requestCurrentPermission() {
    const step = STEPS[currentStep];
    if (step.key === "location") {
      await Location.requestForegroundPermissionsAsync().catch(() => null);
    } else if (step.key === "camera") {
      await Camera.requestCameraPermissionsAsync().catch(() => null);
    } else if (step.key === "media") {
      // writeOnly: only need gallery save access, not full read
      await MediaLibrary.requestPermissionsAsync(true).catch(() => null);
    }
    advanceStep();
  }

  function advanceStep() {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const next = currentStep + 1;
      if (next >= STEPS.length) {
        router.replace("/camera");
      } else {
        setCurrentStep(next);
        slideAnim.setValue(30);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }

  const step = STEPS[currentStep];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Progress dots */}
        <View style={styles.progressRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStep && styles.dotActive,
                i < currentStep && styles.dotDone,
              ]}
            />
          ))}
        </View>

        <Text style={styles.stepLabel}>
          STEP {currentStep + 1} OF {STEPS.length}
        </Text>

        {/* Animated content */}
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Icon — no circle, just the icon */}
          <View style={styles.iconWrap}>
            <Ionicons name={step.icon} size={80} color={step.color} />
          </View>

          <Text style={[styles.subtitle, { color: step.color }]}>
            {step.subtitle}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </Animated.View>

        {/* Bottom */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.allowBtn}
            onPress={requestCurrentPermission}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#3244C2", "#2739A8"]}
              style={styles.allowBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.allowText}>{step.btnLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={advanceStep}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Not now</Text>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <Ionicons name="location" size={13} color="#3244C2" />
            <Text style={styles.brandText}>GeoSnap GPS Camera</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  safe: { flex: 1, alignItems: "center", paddingHorizontal: 28 },

  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D1D9F7" },
  dotActive: { width: 24, backgroundColor: "#3244C2" },
  dotDone: { backgroundColor: "#ADBAF0" },

  stepLabel: {
    fontSize: 11,
    color: "#ADBAF0",
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 20,
  },

  // Just the icon, no circles
  iconWrap: {
    marginBottom: 32,
    padding: 8,
  },

  subtitle: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111111",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: "#6E6E6E",
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 320,
  },

  bottomArea: { width: "100%", paddingBottom: 8, alignItems: "center" },

  allowBtn: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#3244C2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  allowBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  allowText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  skipBtn: { paddingVertical: 12, marginBottom: 20 },
  skipText: { fontSize: 14, color: "#ABABAB", fontWeight: "500" },

  brandRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  brandText: {
    fontSize: 12,
    color: "#ADBAF0",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
