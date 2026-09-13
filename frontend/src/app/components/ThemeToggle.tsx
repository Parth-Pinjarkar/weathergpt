"use client";

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'material' | 'button';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'material',
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();

  if (variant === 'button') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            theme === 'light'
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
          }`}
        >
          <Sun className="h-4 w-4 text-severe-amber" />
          <span>Light Mode</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            theme === 'dark'
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
          }`}
        >
          <Moon className="h-4 w-4 text-atmospheric-cyan" />
          <span>Dark Mode</span>
        </button>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer ${className}`}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-cyan-400" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition cursor-pointer ${className}`}
      title="Toggle Interface Lighting Mode"
    >
      <span className="material-symbols-outlined text-[20px]">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
