import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { COLORS } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      setThemePreference: (pref) => set({ themePreference: pref }),
    }),
    {
      name: 'streakly-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Hook to get the active theme and colors.
 * Subscribes to system appearance changes if preference is 'system'.
 */
export function useTheme() {
  const { themePreference, setThemePreference } = useThemeStore();
  
  // We don't subscribe to useColorScheme from react-native directly here
  // to avoid issues with SSR or hydration, but since this is local-first
  // we can just use Appearance API.
  const systemTheme = Appearance.getColorScheme() ?? 'light';
  
  const activeTheme = themePreference === 'system' ? systemTheme : themePreference;
  const colors = COLORS[activeTheme];

  return {
    themePreference,
    activeTheme,
    colors,
    setThemePreference,
  };
}
