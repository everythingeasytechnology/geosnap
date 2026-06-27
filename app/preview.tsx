import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { useVideoPlayer, VideoView } from 'expo-video';
import { captureStore } from '@/src/store/captureStore';
import { GeoTagOverlay } from '@/src/components/GeoTagOverlay';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;

export default function PreviewScreen() {
  // Ref for the off-screen compositing view (photo + geo-tag baked together)
  const compositeRef = useRef<View>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  // Natural pixel dimensions of the captured photo
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  const capture = captureStore.get();

  const videoPlayer = useVideoPlayer(
    capture?.mode === 'video' ? capture.uri : null,
    (player) => {
      player.loop = true;
      player.play();
    }
  );

  useEffect(() => {
    if (!capture) { router.replace('/camera'); return; }
    if (capture.mode === 'photo') {
      Image.getSize(
        capture.uri,
        (w, h) => setImgSize({ w, h }),
        () => setImgSize({ w: SCREEN_W, h: SCREEN_W }), // fallback square
      );
    }
  }, []);

  if (!capture) return null;

  // Composite dimensions: full screen width, height scaled to natural ratio
  const compositeW = SCREEN_W;
  const compositeH = imgSize
    ? Math.round(SCREEN_W * imgSize.h / imgSize.w)
    : SCREEN_W;

  const handleRetake = () => {
    captureStore.clear();
    router.back();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let uriToSave = capture.uri;

      // For photos with a location: capture the off-screen composite so the
      // geo-tag card is baked into the saved image at the correct position.
      if (capture.mode === 'photo' && capture.location && compositeRef.current) {
        uriToSave = await captureRef(compositeRef, {
          format: 'jpg',
          quality: 0.95,
          result: 'tmpfile',
        });
      }

      await MediaLibrary.saveToLibraryAsync(uriToSave);
      Alert.alert(
        capture.mode === 'photo' ? 'Photo Saved' : 'Video Saved',
        `Your geotagged ${capture.mode} has been saved to your gallery.`,
        [{ text: 'Done', onPress: () => { captureStore.clear(); router.replace('/camera'); } }]
      );
    } catch (e) {
      console.warn('Save failed:', e);
      Alert.alert('Error', 'Could not save. Please check gallery permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await Share.share({ url: capture.uri, title: 'GeoSnap Photo' });
    } catch {
      // share cancelled or failed
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/*
        ── OFF-SCREEN COMPOSITE VIEW ─────────────────────────────────────
        Positioned far below the visible viewport. view-shot captures it
        regardless of on-screen position. The photo is shown at its natural
        aspect ratio (no black letterbox bars) with the geo-tag overlay on top.
      */}
      {capture.mode === 'photo' && capture.location && (
        <View
          ref={compositeRef}
          collapsable={false}
          style={{
            position: 'absolute',
            top: SCREEN_H + 200,
            left: 0,
            width: compositeW,
            height: compositeH,
            overflow: 'hidden',
          }}
        >
          <Image
            source={{ uri: capture.uri }}
            style={{ width: compositeW, height: compositeH }}
            resizeMode="cover"
          />
          <GeoTagOverlay
            location={capture.location}
            note={capture.note}
          />
        </View>
      )}

      {/* ── WHITE TOP BAR ── */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.topIconBtn} onPress={handleRetake} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={22} color="#111111" />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Preview</Text>

          <View style={styles.topRightIcons}>
            <TouchableOpacity
              style={styles.topIconBtn}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.75}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#3244C2" />
              ) : (
                <Ionicons name="download-outline" size={22} color="#3244C2" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topIconBtn}
              onPress={handleShare}
              disabled={isSharing}
              activeOpacity={0.75}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#3244C2" />
              ) : (
                <Ionicons name="share-outline" size={22} color="#3244C2" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── MEDIA PREVIEW ── */}
      {/* flex:1 fills all space. resizeMode="contain" = never crops, black bars for landscape */}
      <View style={styles.mediaContainer}>
        {capture.mode === 'photo' ? (
          <Image
            source={{ uri: capture.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
        ) : (
          <VideoView
            player={videoPlayer}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            nativeControls={false}
          />
        )}

        {capture.location && (
          <GeoTagOverlay location={capture.location} note={capture.note} />
        )}

        {!capture.location && (
          <View style={styles.noLocTag}>
            <Ionicons name="location-outline" size={12} color="#6E6E6E" />
            <Text style={styles.noLocText}>No GPS data</Text>
          </View>
        )}

        {capture.mode === 'video' && (
          <View style={styles.videoLabel}>
            <Ionicons name="videocam" size={13} color="#FFFFFF" />
            <Text style={styles.videoLabelText}>VIDEO</Text>
          </View>
        )}
      </View>

      {/* ── WHITE BOTTOM ACTIONS ── */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        {!!capture.note && (
          <View style={styles.noteRow}>
            <Ionicons name="pencil-outline" size={14} color="#3244C2" />
            <Text style={styles.noteText} numberOfLines={2}>
              {capture.note}
            </Text>
          </View>
        )}

        {capture.location && (
          <View style={styles.locRow}>
            <Ionicons name="location" size={13} color="#3244C2" />
            <Text style={styles.locText} numberOfLines={1}>
              {capture.location.city
                ? `${capture.location.city}, ${capture.location.region}`
                : capture.location.address}
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="#3244C2" />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.88}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="download" size={18} color="#FFFFFF" />
                <Text style={styles.saveText}>Save to Gallery</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },

  topBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.2,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FF',
  },
  topRightIcons: {
    flexDirection: 'row',
    gap: 8,
  },

  // flex:1 fills all space between top and bottom bars
  mediaContainer: {
    flex: 1,
    backgroundColor: '#111111',
  },

  noLocTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  noLocText: {
    fontSize: 11,
    color: '#6E6E6E',
    fontWeight: '500',
  },

  videoLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(220,38,38,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  videoLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EEF1FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#111111',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  locText: {
    fontSize: 12,
    color: '#6E6E6E',
    flex: 1,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#EEF1FD',
    borderWidth: 1.5,
    borderColor: '#D1D9F7',
  },
  retakeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3244C2',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#3244C2',
    shadowColor: '#3244C2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
