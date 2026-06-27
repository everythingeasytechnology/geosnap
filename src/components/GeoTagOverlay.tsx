import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Line, Circle, Rect, Path } from 'react-native-svg';
import type { LocationData } from '../store/captureStore';

// Convert heading degrees to cardinal direction
function headingToCompass(deg: number | null): string {
  if (deg == null) return 'N';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

// Country code to flag emoji
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  try {
    return String.fromCodePoint(
      ...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397)
    );
  } catch {
    return '';
  }
}

// Minimal map-like SVG placeholder
function MapThumbnail() {
  return (
    <View style={styles.mapBox}>
      <Svg width={72} height={72} viewBox="0 0 72 72">
        {/* Background */}
        <Rect x="0" y="0" width="72" height="72" fill="#1A2878" rx="6" />
        {/* Road-like lines */}
        <Line x1="0" y1="36" x2="72" y2="36" stroke="#2739A8" strokeWidth="6" />
        <Line x1="36" y1="0" x2="36" y2="72" stroke="#2739A8" strokeWidth="4" />
        <Line x1="0" y1="20" x2="72" y2="20" stroke="#2739A8" strokeWidth="1.5" />
        <Line x1="0" y1="52" x2="72" y2="52" stroke="#2739A8" strokeWidth="1.5" />
        <Line x1="20" y1="0" x2="20" y2="72" stroke="#2739A8" strokeWidth="1.5" />
        <Line x1="52" y1="0" x2="52" y2="72" stroke="#2739A8" strokeWidth="1.5" />
        {/* Small blocks (buildings) */}
        <Rect x="6" y="6" width="10" height="10" fill="#2739A8" rx="1" />
        <Rect x="55" y="6" width="10" height="10" fill="#2739A8" rx="1" />
        <Rect x="6" y="55" width="10" height="10" fill="#2739A8" rx="1" />
        <Rect x="55" y="55" width="10" height="10" fill="#2739A8" rx="1" />
        {/* Location pin */}
        <Circle cx="36" cy="32" r="7" fill="#3244C2" />
        <Circle cx="36" cy="32" r="3.5" fill="#FFFFFF" />
        <Path d="M36 39 L33 44 Q36 46 39 44 Z" fill="#3244C2" />
      </Svg>
    </View>
  );
}

type Props = {
  location: LocationData;
  note?: string;
  style?: StyleProp<ViewStyle>;
};

export function GeoTagOverlay({ location, note, style }: Props) {
  const date = new Date(location.timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = ((hours % 12) || 12).toString().padStart(2, '0');
  const dateStr = `${day} ${month} ${year}, ${h12}:${minutes} ${ampm}`;

  const lat = Math.abs(location.latitude).toFixed(4);
  const lng = Math.abs(location.longitude).toFixed(4);
  const latDir = location.latitude >= 0 ? 'N' : 'S';
  const lngDir = location.longitude >= 0 ? 'E' : 'W';
  const alt = location.altitude != null ? ` ${Math.round(location.altitude)}m` : '';
  const compass = headingToCompass(location.heading);
  const flag = countryFlag(location.countryCode);

  // Location header: "City, Region, Country 🏴"
  const cityLine = [location.city, location.region, location.country]
    .filter(Boolean)
    .join(', ');
  const locationHeader = flag ? `${cityLine} ${flag}` : cityLine || location.address;

  // Address body
  const addressBody = location.street
    ? `${location.street}${location.postalCode ? ', ' + location.postalCode : ''}`
    : '';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        {/* Left: Map */}
        <MapThumbnail />

        {/* Right: Location info */}
        <View style={styles.info}>
          {/* City / Country header */}
          <Text style={styles.cityText} numberOfLines={1}>
            {locationHeader || 'Location'}
          </Text>

          {/* Address */}
          {!!addressBody && (
            <Text style={styles.addressText} numberOfLines={2}>
              {addressBody}
            </Text>
          )}

          {/* Coordinates */}
          <Text style={styles.coordsText}>
            {compass}  Lat: {lat}{latDir} · Long: {lng}{lngDir}{alt}
          </Text>

          {/* Date / time */}
          <Text style={styles.dateText}>{dateStr}</Text>

          {/* Note (if any) */}
          {!!note && (
            <Text style={styles.noteText} numberOfLines={2}>
              "{note}"
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,14,42,0.88)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(39,57,168,0.5)',
  },
  mapBox: {
    width: 72,
    height: 72,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 2,
  },
  cityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  addressText: {
    fontSize: 10,
    color: '#ADBAF0',
    lineHeight: 13,
  },
  coordsText: {
    fontSize: 10,
    color: '#8896EB',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  dateText: {
    fontSize: 10,
    color: '#8896EB',
    marginTop: 1,
  },
  noteText: {
    fontSize: 10,
    color: '#D1D9F7',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
