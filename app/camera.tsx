import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
} from "react-native";
import {
  CameraView,
  CameraType,
  FlashMode,
  CameraMode,
  Camera,
} from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocation } from "@/src/hooks/useLocation";
import { NoteModal } from "@/src/components/NoteModal";
import { GeoTagOverlay } from "@/src/components/GeoTagOverlay";
import { captureStore } from "@/src/store/captureStore";

const { width, height } = Dimensions.get("window");

type CaptureMode = "photo" | "video";
// expo-camera v17 types only expose 'auto'|'off', but 'on' works at runtime
type FlashPref = "off" | "on" | "auto";

const toCameraMode = (m: CaptureMode): CameraMode =>
  m === "photo" ? "picture" : "video";

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashPref>("off");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [pendingUri, setPendingUri] = useState<{
    uri: string;
    mode: CaptureMode;
  } | null>(null);

  const {
    location,
    loading: locationLoading,
    error: locationError,
    fetchLocation,
  } = useLocation();

  useFocusEffect(
    useCallback(() => {
      fetchLocation();
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [fetchLocation]),
  );

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // FlashMode types in v17 are incomplete; 'on' works at runtime — cast when passing to CameraView
  const cycleFlash = () =>
    setFlash((f) => (f === "off" ? "on" : f === "on" ? "auto" : "off"));

  const flashIcon = (): keyof typeof Ionicons.glyphMap => {
    if (flash === "on") return "flash";
    if (flash === "auto") return "flash-outline";
    return "flash-off";
  };

  const flashLabel = () =>
    flash === "on" ? "On" : flash === "auto" ? "Auto" : "Off";

  const toggleFacing = () =>
    setFacing((f) => (f === "back" ? "front" : "back"));

  const takePhoto = async () => {
    if (!cameraRef.current || isProcessing || !isCameraReady) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
        exif: true,
      });
      setPendingUri({ uri: photo.uri, mode: "photo" });
      setShowNoteModal(true);
    } catch (e) {
      console.warn("Photo capture failed:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording || !isCameraReady) return;

    // Ensure microphone permission is granted before recording
    const micPerm = await Camera.getMicrophonePermissionsAsync().catch(() => ({
      granted: false,
    }));
    if (!micPerm.granted) {
      const result = await Camera.requestMicrophonePermissionsAsync().catch(
        () => ({ granted: false }),
      );
      if (!result.granted) {
        Alert.alert(
          "Microphone Required",
          "Please allow microphone access to record video with audio. You can enable it in Settings.",
          [{ text: "OK" }],
        );
        return;
      }
    }

    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(
      () => setRecordingSeconds((s) => s + 1),
      1000,
    );
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 300 });
      if (video?.uri) {
        setPendingUri({ uri: video.uri, mode: "video" });
        setShowNoteModal(true);
      }
    } catch (e) {
      console.warn("Recording failed:", e);
    } finally {
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingSeconds(0);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !isRecording) return;
    cameraRef.current.stopRecording();
  };

  const handleCapturePress = () => {
    if (captureMode === "photo") takePhoto();
    else isRecording ? stopRecording() : startRecording();
  };

  const handleNoteSubmit = (note: string) => {
    if (!pendingUri) return;
    setShowNoteModal(false);
    captureStore.set({
      uri: pendingUri.uri,
      mode: pendingUri.mode,
      location: location ?? null,
      note,
    });
    setPendingUri(null);
    router.push("/preview");
  };

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const switchMode = (mode: CaptureMode) => {
    if (!isRecording) setCaptureMode(mode);
  };

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash as FlashMode}
        mode={toCameraMode(captureMode)}
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* Top gradient */}
      <LinearGradient
        colors={["rgba(0,0,0,0.72)", "transparent"]}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.82)"]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* ── TOP BAR ── */}
      <SafeAreaView style={styles.topBar} edges={["top"]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={cycleFlash}
            activeOpacity={0.75}
          >
            <Ionicons name={flashIcon()} size={22} color="#FFFFFF" />
            <Text style={styles.topIconLabel}>{flashLabel()}</Text>
          </TouchableOpacity>

          <View style={styles.brandCenter}>
            <Ionicons name="location" size={13} color="#3244C2" />
            <Text style={styles.brandName}>GeoSnap</Text>
          </View>

          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={toggleFacing}
            activeOpacity={0.75}
          >
            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
            <Text style={styles.topIconLabel}>Flip</Text>
          </TouchableOpacity>
        </View>

        {/* Error state only — loading is shown as a centered overlay */}
        {!locationLoading && !!locationError && (
          <View style={styles.locationBar}>
            <View style={styles.locationRow}>
              <Ionicons name="warning-outline" size={13} color="#F97316" />
              <Text style={[styles.locationText, { color: "#F97316" }]}>
                Location unavailable
              </Text>
              <TouchableOpacity
                onPress={fetchLocation}
                style={styles.retryBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Recording badge */}
      {isRecording && (
        <View style={styles.recBadge}>
          <Animated.View
            style={[styles.recDot, { transform: [{ scale: pulseAnim }] }]}
          />
          <Text style={styles.recTimer}>
            {formatDuration(recordingSeconds)}
          </Text>
          <Text style={styles.recLabel}>REC</Text>
        </View>
      )}

      {/* ── BOTTOM CONTROLS ── */}
      <SafeAreaView style={styles.bottomBar} edges={["bottom"]}>
        {/* GeoTag card — in flow, always above mode/capture buttons */}
        {location && (
          <GeoTagOverlay location={location} style={styles.geoTagInCamera} />
        )}

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            onPress={() => switchMode("photo")}
            style={styles.modeBtn}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeText,
                captureMode === "photo" && styles.modeTextActive,
              ]}
            >
              PHOTO
            </Text>
            {captureMode === "photo" && <View style={styles.modeUnderline} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => switchMode("video")}
            style={styles.modeBtn}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeText,
                captureMode === "video" && styles.modeTextActive,
              ]}
            >
              VIDEO
            </Text>
            {captureMode === "video" && <View style={styles.modeUnderline} />}
          </TouchableOpacity>
        </View>

        {/* Capture row */}
        <View style={styles.captureRow}>
          <View style={styles.sideBtn} />

          <TouchableOpacity
            onPress={handleCapturePress}
            activeOpacity={0.85}
            disabled={isProcessing || !isCameraReady || locationLoading}
            style={[
              styles.captureBtnWrapper,
              locationLoading && { opacity: 0.4 },
            ]}
          >
            <View
              style={[
                styles.captureOuter,
                captureMode === "video" &&
                  isRecording &&
                  styles.captureOuterRecording,
              ]}
            >
              {captureMode === "photo" ? (
                <View style={styles.captureInnerPhoto}>
                  {isProcessing && (
                    <ActivityIndicator size="small" color="#0B0D1A" />
                  )}
                </View>
              ) : isRecording ? (
                <View style={styles.captureInnerStop} />
              ) : (
                <View style={styles.captureInnerRecord} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideBtn}
            onPress={toggleFacing}
            activeOpacity={0.75}
          >
            <View style={styles.sideBtnInner}>
              <MaterialIcons name="flip-camera-ios" size={26} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Centered location loading overlay — covers full screen while GPS acquires */}
      {locationLoading && (
        <View style={styles.locationOverlay} pointerEvents="none">
          <View style={styles.locationOverlayCard}>
            <ActivityIndicator size="large" color="#6272DF" />
            <Text style={styles.locationOverlayText}>Acquiring location…</Text>
          </View>
        </View>
      )}

      <NoteModal
        visible={showNoteModal}
        onSubmit={handleNoteSubmit}
        onSkip={() => handleNoteSubmit("")}
      />
    </View>
  );
}

const CAPTURE_SIZE = 80;
const OUTER_SIZE = 96;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  topIconBtn: { alignItems: "center", gap: 2, minWidth: 44 },
  topIconLabel: { fontSize: 10, color: "#FFFFFF", fontWeight: "600" },
  brandCenter: { flexDirection: "row", alignItems: "center", gap: 5 },
  brandName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  // Location bar
  locationBar: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "rgba(11,13,26,0.65)",
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(98,114,223,0.25)",
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: { fontSize: 11, color: "#8896EB", fontWeight: "500" },
  locationCoords: {
    fontSize: 11,
    color: "#6272DF",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  locationSep: { fontSize: 11, color: "#4A5568" },
  locationAddress: { fontSize: 11, color: "#8892A4", flex: 1 },
  retryBtn: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F97316",
  },
  retryText: { fontSize: 11, color: "#F97316", fontWeight: "600" },

  // Recording badge
  recBadge: {
    position: "absolute",
    top: "47%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(220,38,38,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  recTimer: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  recLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
  },

  // GeoTag: in normal flow inside bottomBar, above mode/capture buttons
  geoTagInCamera: {
    position: "relative",
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 12,
    marginBottom: 10,
    zIndex: 1,
  },

  // Bottom controls
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: 8,
  },
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginBottom: 20,
  },
  modeBtn: { alignItems: "center", paddingVertical: 4 },
  modeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 2,
  },
  modeTextActive: { color: "#FFFFFF" },
  modeUnderline: {
    marginTop: 4,
    height: 2,
    width: "80%",
    backgroundColor: "#3244C2",
    borderRadius: 1,
  },

  // Capture
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  sideBtn: { flex: 1, alignItems: "center" },
  sideBtnInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnWrapper: { flex: 1, alignItems: "center" },
  captureOuter: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureOuterRecording: { borderColor: "#EF4444" },
  captureInnerPhoto: {
    width: CAPTURE_SIZE,
    height: CAPTURE_SIZE,
    borderRadius: CAPTURE_SIZE / 2,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInnerRecord: {
    width: CAPTURE_SIZE,
    height: CAPTURE_SIZE,
    borderRadius: CAPTURE_SIZE / 2,
    backgroundColor: "#EF4444",
  },
  captureInnerStop: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EF4444",
  },

  // Centered location loading overlay
  locationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  locationOverlayCard: {
    backgroundColor: "rgba(10,14,42,0.92)",
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 28,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(50,68,194,0.45)",
  },
  locationOverlayText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
