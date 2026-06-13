'use client';

import { useTheme } from '@/lib/theme';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-sm font-medium text-white/90 hover:text-white backdrop-blur-sm"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun size={16} className="text-white/60" />
      ) : (
        <Moon size={16} className="text-white/60" />
      )}
      <span className="font-semibold">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
