import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Svg, { Line, Circle, Rect, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import type { LocationData } from "../store/captureStore";

// Convert heading degrees to cardinal direction
function headingToCompass(deg: number | null): string {
  if (deg == null) return "N";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

const MAP_SIZE = 72;
// Degrees of latitude spanned by the thumbnail — a tight, street-level satellite crop
const MAP_SPAN_DEG = 0.0035;

// Esri's classic World Imagery REST endpoint serves static satellite crops
// without an API key — the only network dependency, using just RN's built-in Image.
function satelliteMapUrl(lat: number, lng: number): string {
  const latSpan = MAP_SPAN_DEG;
  const lngSpan = MAP_SPAN_DEG / Math.cos((lat * Math.PI) / 180);
  const bbox = [
    lng - lngSpan / 2,
    lat - latSpan / 2,
    lng + lngSpan / 2,
    lat + latSpan / 2,
  ].join(",");
  const pixelSize = MAP_SIZE * 2; // retina-sharp thumbnail
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=${pixelSize},${pixelSize}&format=jpg&transparent=false&f=image`;
}

// Grid placeholder shown while the satellite image loads, or if it fails (e.g. offline)
function MapPlaceholder() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 72 72" style={StyleSheet.absoluteFill}>
      <Rect x="0" y="0" width="72" height="72" fill="#1A2878" />
      <Line x1="0" y1="36" x2="72" y2="36" stroke="#2739A8" strokeWidth="6" />
      <Line x1="36" y1="0" x2="36" y2="72" stroke="#2739A8" strokeWidth="4" />
      <Line x1="0" y1="20" x2="72" y2="20" stroke="#2739A8" strokeWidth="1.5" />
      <Line x1="0" y1="52" x2="72" y2="52" stroke="#2739A8" strokeWidth="1.5" />
      <Line x1="20" y1="0" x2="20" y2="72" stroke="#2739A8" strokeWidth="1.5" />
      <Line x1="52" y1="0" x2="52" y2="72" stroke="#2739A8" strokeWidth="1.5" />
      <Rect x="6" y="6" width="10" height="10" fill="#2739A8" rx="1" />
      <Rect x="55" y="6" width="10" height="10" fill="#2739A8" rx="1" />
      <Rect x="6" y="55" width="10" height="10" fill="#2739A8" rx="1" />
      <Rect x="55" y="55" width="10" height="10" fill="#2739A8" rx="1" />
    </Svg>
  );
}

// Real satellite thumbnail centered on the actual GPS coordinates, with a pin overlay
function MapThumbnail({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const uri = useMemo(
    () => satelliteMapUrl(latitude, longitude),
    [latitude, longitude],
  );

  // Reset load state whenever the coordinates (and thus the crop) change,
  // so a stale image from the previous location is never shown as current.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [uri]);

  return (
    <View style={styles.mapBox}>
      {(!loaded || failed) && <MapPlaceholder />}
      {!failed && (
        <Image
          key={uri}
          source={{ uri }}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {/* Pin tip lands exactly at (36,36) — the true center of the box,
          which is also the exact coordinate the satellite crop is centered on.
          The box is always square (aspectRatio: 1), so this never distorts. */}
      <Svg width="100%" height="100%" viewBox="0 0 72 72" style={StyleSheet.absoluteFill}>
        <Circle cx="36" cy="22" r="7" fill="#3244C2" />
        <Circle cx="36" cy="22" r="3.5" fill="#FFFFFF" />
        <Path d="M36 29 L33 34 Q36 36 39 34 Z" fill="#3244C2" />
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
  const day = date.getDate().toString().padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = (hours % 12 || 12).toString().padStart(2, "0");
  const dateStr = `${day} ${month} ${year}, ${h12}:${minutes} ${ampm}`;

  const lat = Math.abs(location.latitude).toFixed(4);
  const lng = Math.abs(location.longitude).toFixed(4);
  const latDir = location.latitude >= 0 ? "N" : "S";
  const lngDir = location.longitude >= 0 ? "E" : "W";
  const alt =
    location.altitude != null ? `${Math.round(location.altitude)}m` : null;
  const compass = headingToCompass(location.heading);

  // Location header: "City, Region, Country"
  const cityLine = [location.city, location.region, location.country]
    .filter(Boolean)
    .join(", ");
  const locationHeader = cityLine || location.address;

  // Address body
  const addressBody = location.street
    ? `${location.street}${location.postalCode ? ", " + location.postalCode : ""}`
    : "";

  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        {/* Left: Map */}
        <MapThumbnail
          latitude={location.latitude}
          longitude={location.longitude}
        />

        {/* Right: Location info */}
        <View style={styles.info}>
          {/* City / Country header */}
          <Text style={styles.cityText} numberOfLines={1}>
            <Ionicons
              name="location-outline"
              size={10}
              color="#ffffff"
              style={styles.addressIcon}
            />{" "}
            {locationHeader || "Location"}
          </Text>

          {/* Address */}
          {!!addressBody && (
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={2}>
                {addressBody}
              </Text>
            </View>
          )}

          {/* Coordinates */}
          <Text style={styles.coordsText}>
            Lat: {lat}
            {latDir} · Long: {lng} · Altitude: {alt}
            {lngDir}
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
    position: "absolute",
    bottom: 16,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "rgba(10,14,42,0.88)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    // borderColor: "rgba(39,57,168,0.5)",
  },
  mapBox: {
    // No fixed width or height — aspectRatio keeps it a perfect square,
    // with width derived from the stretched (auto) height set by `card`'s
    // default alignItems: 'stretch', so it grows without ever distorting.
    aspectRatio: 1,
    minWidth: MAP_SIZE,
    flexShrink: 0,
    backgroundColor: "#1A2878",
    borderRadius: 6,
    overflow: "hidden",
  },
  info: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
    gap: 2,
  },
  cityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 10,
    color: "#ffffff",
    lineHeight: 13,
  },
  coordsText: {
    fontSize: 10,
    color: "#ffffff",
    fontFamily: "monospace",
    marginTop: 1,
  },
  dateText: {
    fontSize: 10,
    color: "#ffffff",
    marginTop: 1,
  },
  noteText: {
    fontSize: 10,
    color: "#D1D9F7",
    fontStyle: "italic",
    marginTop: 2,
  },
});
