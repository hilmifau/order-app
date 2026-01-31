import { createContext, useContext, useState } from 'react';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  
  // If context is not available, return default dark theme
  if (!context) {
    return {
      colorScheme: 'dark' as ColorScheme,
      toggleTheme: () => {},
    };
  }
  
  return context;
}

export function useThemeState() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');

  const toggleTheme = () => {
    setColorScheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { colorScheme, toggleTheme };
}
