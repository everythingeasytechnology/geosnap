import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import type { LocationData } from '../store/captureStore';

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLocation(null); // clear stale location so old geo-tag hides during fetch
    try {
      const { granted } = await Location.getForegroundPermissionsAsync();
      if (!granted) {
        setError('Location permission not granted');
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      let street = '';
      let city = '';
      let region = '';
      let country = '';
      let countryCode = '';
      let postalCode = '';
      let address = 'Unknown Location';

      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (results.length > 0) {
          const geo = results[0];
          street =
            [geo.streetNumber, geo.street].filter(Boolean).join(' ') ||
            geo.district ||
            geo.name ||
            '';
          city = geo.city ?? geo.subregion ?? '';
          region = geo.region ?? '';
          country = geo.country ?? '';
          countryCode = geo.isoCountryCode ?? '';
          postalCode = geo.postalCode ?? '';

          const parts = [street, city, region, country].filter(Boolean);
          if (parts.length > 0) address = parts.join(', ');
        }
      } catch {
        // keep defaults
      }

      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        altitude: pos.coords.altitude,
        heading: pos.coords.heading,
        address,
        street,
        city,
        region,
        country,
        countryCode,
        postalCode,
        timestamp: Date.now(),
      });
    } catch {
      setError('Failed to get location');
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, fetchLocation };
}
