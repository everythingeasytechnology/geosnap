// Main app theme - light/white minimal, accent: #00C4A8
export const colors = {
  primary: '#00C4A8',
  primaryDark: '#009E87',
  primaryLight: '#E6FAF8',
  primaryBorder: '#99E6DC',
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E8EDF3',
  borderLight: '#F0F4F8',
  text: '#0D1B2A',
  textSec: '#6B7A8D',
  textMuted: '#9BA8B5',
  error: '#EF4444',
  errorBg: 'rgba(239,68,68,0.08)',
  warning: '#F59E0B',
  success: '#22C55E',
  successBg: 'rgba(34,197,94,0.08)',
  white: '#FFFFFF',
  black: '#000000',
  inputBg: '#F5F7FA',
  placeholder: '#9BA8B5',
  overlay: 'rgba(13,27,42,0.55)',
  tabBarBg: '#FFFFFF',
  inactive: '#B0BEC5',
  tealCard: '#0D4F4B',
  tealCardText: '#FFFFFF',
};

// Auth screens use dark background with white card
export const authColors = {
  bg: '#111827',
  cardBg: '#FFFFFF',
  titleText: '#FFFFFF',
  subtitleText: '#9CA3AF',
  primary: '#00C4A8',
  primaryDark: '#009E87',
  tabActiveBg: '#1F2937',
  inputBg: '#F5F7FA',
  border: '#E8EDF3',
  text: '#0D1B2A',
  textSec: '#6B7A8D',
  placeholder: '#9BA8B5',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  primary: {
    shadowColor: '#00C4A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
};
