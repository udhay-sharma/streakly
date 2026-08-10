/**
 * constants/colors.ts — Streakly color tokens
 * 
 * Defines the light ("mountain morning") and dark ("night sky") palettes.
 */

export const COLORS = {
  light: {
    background: '#F7F1E7',
    surface: '#FFFDF8',
    text: '#3B362F',
    textSecondary: '#8A7F6C',
    border: '#E3D9C6',
    primary: '#A9764A',   // clay
    secondary: '#8A9A78', // sage
    // Fallbacks
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  dark: {
    background: '#10151C',
    surface: '#1B222C',
    text: '#E8ECF1',
    textSecondary: '#8B94A3',
    border: '#232C38',
    primary: '#6C8EBF',   // moonlight blue
    secondary: '#4F6A8C', // dusk blue
    // Fallbacks
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  }
};