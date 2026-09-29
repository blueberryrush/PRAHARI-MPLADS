import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'prahari_theme';

export function ThemeProvider({ children }) {
  const theme = 'light';
  const isDark = false;

  // Apply light theme class and data-theme attribute permanently to documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';

    try {
      localStorage.setItem(STORAGE_KEY, 'light');
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleTheme = () => {};
  const setTheme = () => {};

  const value = useMemo(
    () => ({
      theme: 'light',
      isDark: false,
      toggleTheme,
      setTheme,
    }),
    []
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
