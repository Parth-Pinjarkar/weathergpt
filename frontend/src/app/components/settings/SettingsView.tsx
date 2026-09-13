/**
 * WeatherGPT - SettingsView Component
 * User preferences, operational mode configurations, language selector,
 * and telemetry sync diagnostics.
 */

import React from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Sun,
  Moon,
  Layers,
  User,
  CheckCircle2,
} from 'lucide-react';
import { UserRole, NwpModel, UserProfile } from '../../lib/types';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '../../i18n';

interface SettingsViewProps {
  currentLang: SupportedLanguage;
  theme: 'light' | 'dark';
  currentMode: UserRole;
  activeModel: NwpModel;
  currentUser: UserProfile | null;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onThemeToggle: () => void;
  onModeChange: (mode: UserRole) => void;
  onModelChange: (model: NwpModel) => void;
  onOpenAuthModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentLang,
  theme,
  currentMode,
  activeModel,
  currentUser,
  onLanguageChange,
  onThemeToggle,
  onModeChange,
  onModelChange,
  onOpenAuthModal,
}) => {
  return (
    <div className="p-space-md lg:p-space-lg flex flex-col gap-space-md max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <div className="w-12 h-12 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-headline-lg text-lg md:text-xl font-bold text-on-surface">
              System Settings &amp; Telemetry Profile
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant font-mono mt-0.5">
              Configure localization, NWP forecasting resolution, and operational role defaults.
            </p>
          </div>
        </div>
      </div>

      {/* User Account / Profile Section */}
      {onOpenAuthModal && (
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">
                {currentUser ? currentUser.name : 'Guest User'}
              </h3>
              <p className="text-xs text-on-surface-variant font-mono">
                {currentUser ? currentUser.email : 'Sign in to save preferences across devices'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-3.5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-hover transition cursor-pointer"
          >
            {currentUser ? 'Manage Account' : 'Sign In'}
          </button>
        </div>
      )}

      {/* 1. Language & Localization */}
      <section className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col gap-space-sm">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="font-headline-sm text-base font-bold text-on-surface">
            Multilingual Vernacular Localization
          </h2>
        </div>
        <p className="text-xs text-on-surface-variant font-mono">
          Select primary synoptic reporting language. WeatherGPT will auto-translate forecasts, warnings, and speech outputs.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => onLanguageChange(lang.code as SupportedLanguage)}
              className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                currentLang === lang.code
                  ? 'bg-primary-fixed/40 border-primary shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container-high border-surface-container-high'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-on-surface">{lang.name}</span>
                {currentLang === lang.code && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              </div>
              <span className="font-mono text-[10px] text-outline uppercase mt-1">{lang.englishName}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Operational Persona Role */}
      <section className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col gap-space-sm">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-secondary" />
          <h2 className="font-headline-sm text-base font-bold text-on-surface">
            Operational Weather Domain Persona
          </h2>
        </div>
        <p className="text-xs text-on-surface-variant font-mono">
          Customizes AI reasoning and risk thresholds for your daily operations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
          {[
            { id: 'general', title: 'Public Citizen', desc: 'Standard commute & thermal advisories', icon: '👥' },
            { id: 'farmer', title: 'Kisan / Farmer', desc: 'Spray schedules, crop phenology & rainfall', icon: '🌾' },
            { id: 'aviation', title: 'Aviation Pilot', desc: 'METAR, cloud ceiling & crosswind vectors', icon: '✈️' },
            { id: 'smartcity', title: 'Smart City Admin', desc: 'Heat island index & urban drainage risk', icon: '🏙️' },
          ].map((persona) => (
            <button
              key={persona.id}
              type="button"
              onClick={() => onModeChange(persona.id as UserRole)}
              className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                currentMode === persona.id
                  ? 'bg-primary-fixed/40 border-primary shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container-high border-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{persona.icon}</span>
                <span className="font-bold text-xs text-on-surface">{persona.title}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2 leading-tight">{persona.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Theme & NWP Resolution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {/* Interface Theme */}
        <section className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sun className="h-5 w-5 text-severe-amber" />
              <h2 className="font-bold text-sm text-on-surface">Visual Lighting Mode</h2>
            </div>
            <p className="text-xs text-on-surface-variant font-mono">
              Toggle between Crisp Light and Deep Synoptic Dark themes.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={onThemeToggle}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-low text-on-surface border-surface-container-high'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span>Light Mode</span>
            </button>
            <button
              type="button"
              onClick={onThemeToggle}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                theme === 'dark'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-low text-on-surface border-surface-container-high'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span>Dark Mode</span>
            </button>
          </div>
        </section>

        {/* NWP Forecasting Model */}
        <section className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-sm text-on-surface">Default NWP Model</h2>
            </div>
            <p className="text-xs text-on-surface-variant font-mono">
              Select numerical weather prediction consensus source.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {(
              [
                { id: 'ensemble', label: 'Ensemble' },
                { id: 'gfs', label: 'NOAA GFS' },
                { id: 'ecmwf', label: 'ECMWF IFS' },
                { id: 'icon', label: 'DWD ICON' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onModelChange(m.id)}
                className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold transition cursor-pointer ${
                  activeModel === m.id
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface border-surface-container-high'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
