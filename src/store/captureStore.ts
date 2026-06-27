export type LocationData = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  heading: number | null;
  address: string;
  street: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  postalCode: string;
  timestamp: number;
};

export type CaptureData = {
  uri: string;
  mode: 'photo' | 'video';
  location: LocationData | null;
  note: string;
};

let _data: CaptureData | null = null;

export const captureStore = {
  set: (data: CaptureData) => {
    _data = data;
  },
  get: (): CaptureData | null => _data,
  clear: () => {
    _data = null;
  },
};
