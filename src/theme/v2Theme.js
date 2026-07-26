export const V2_COLORS = {
  background: '#080D18',
  backgroundSoft: '#0B1020',
  surface: '#111A2D',
  surfaceRaised: '#18243A',
  surfaceDark: '#0D1628',

  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primarySoft: 'rgba(59, 130, 246, 0.16)',

  accent: '#00E5C7',
  accentSoft: 'rgba(0, 229, 199, 0.14)',

  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.14)',

  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.14)',

  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.14)',

  purple: '#8B5CF6',
  purpleSoft: 'rgba(139, 92, 246, 0.14)',

  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDim: '#64748B',

  border: '#24324A',
  borderSoft: '#1B2940',
  overlay: 'rgba(0, 0, 0, 0.72)',
  white: '#FFFFFF',
  black: '#000000',
};

export const V2_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
};

export const V2_RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const V2_TYPOGRAPHY = {
  title: 26,
  subtitle: 18,
  body: 15,
  caption: 13,
  tiny: 11,
};

export const V2_SHADOWS = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 7,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const V2_THEME = {
  colors: V2_COLORS,
  spacing: V2_SPACING,
  radius: V2_RADIUS,
  typography: V2_TYPOGRAPHY,
  shadows: V2_SHADOWS,
};

export default V2_THEME;
