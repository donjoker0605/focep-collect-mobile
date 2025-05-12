import { configureFonts, MD3LightTheme } from 'react-native-paper';

// Configuration des polices
const fontConfig = {
  regular: {
    fontFamily: 'System',
    fontWeight: '400',
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500',
  },
  light: {
    fontFamily: 'System',
    fontWeight: '300',
  },
  thin: {
    fontFamily: 'System',
    fontWeight: '100',
  },
};

const fonts = configureFonts({ config: fontConfig });

// Couleurs personnalisées pour FOCEP
export const theme = {
  ...MD3LightTheme,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D31', // Vert principal
    onPrimary: '#FFFFFF',
    primaryContainer: '#A5D6A7',
    onPrimaryContainer: '#1B5E20',
    secondary: '#4CAF50', // Vert secondaire
    onSecondary: '#FFFFFF',
    secondaryContainer: '#C8E6C9',
    onSecondaryContainer: '#2E7D31',
    tertiary: '#81C784',
    onTertiary: '#1B5E20',
    tertiaryContainer: '#E8F5E9',
    onTertiaryContainer: '#2E7D31',
    error: '#B00020',
    onError: '#FFFFFF',
    errorContainer: '#FDEAEA',
    onErrorContainer: '#B00020',
    background: '#FAFAFA',
    onBackground: '#1C1B1F',
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
    inversePrimary: '#81C784',
    elevation: {
      level0: 'transparent',
      level1: '#F7F2FA',
      level2: '#F1EDF7',
      level3: '#ECE6F0',
      level4: '#E9E3EA',
      level5: '#E6E0E9',
    },
  },
};