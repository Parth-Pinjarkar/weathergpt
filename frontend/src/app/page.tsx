"use client";

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

import DisasterSimulationModal from './components/DisasterSimulationModal';
import EmergencyCenterModal from './components/EmergencyCenterModal';
import ClimateInsightsModal from './components/ClimateInsightsModal';
import ReportGeneratorModal from './components/ReportGeneratorModal';
import AuthModal from './components/AuthModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { AlertsView } from './components/alerts/AlertsView';
import { RouteView } from './components/route/RouteView';
import { SettingsView } from './components/settings/SettingsView';
import { ChatDrawer } from './components/chat/ChatDrawer';

import { useWeatherData } from './hooks/useWeatherData';
import { useSpeech } from './hooks/useSpeech';
import { useChatSession } from './hooks/useChatSession';

import {
  ActiveTab,
  UserRole,
  UserProfile,
} from './lib/types';
import {
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  getStoredRole,
  setStoredRole,
} from './lib/auth';
import { DEFAULT_LOCATION } from './constants/location';
import {
  SupportedLanguage,
  getSavedLanguage,
  saveLanguagePreference,
} from './i18n';

import { ThemeToggle } from './components/ThemeToggle';
import { WeatherDebugPanel } from './components/WeatherDebugPanel';

// Dynamically import WeatherMap with SSR disabled (Leaflet requires window)
const WeatherMap = dynamic(() => import('./components/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center bg-surface-container-lowest text-outline">
      <RefreshCw className="h-8 w-8 animate-spin mr-3 text-primary" />
      Loading Interactive Weather Map...
    </div>
  ),
});

export default function WeatherGPTApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => getSavedLanguage());
  const [currentMode, setCurrentMode] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const user = getStoredUser();
      if (user?.role) return user.role;
      const savedRole = getStoredRole();
      if (savedRole) return savedRole;
    }
    return 'general';
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      return getStoredUser();
    }
    return null;
  });

  const [searchLocation, setSearchLocation] = useState<string>(DEFAULT_LOCATION.fullName);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [simModalOpen, setSimModalOpen] = useState<boolean>(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);
  const [climateModalOpen, setClimateModalOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  // Custom Hooks
  const {
    location,
    weather,
    risk,
    activeModel,
    loading: weatherLoading,
    error: weatherError,
    changeLocation,
    changeModel,
    refresh: refreshWeather,
  } = useWeatherData(DEFAULT_LOCATION.fullName);


  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useSpeech(currentLang);

  const {
    messages,
    loading: chatLoading,
    sendMessage,
    clearChat,
  } = useChatSession({
    userRole: currentMode,
    language: currentLang,
    currentLocation: location,
  });

  const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
    setCurrentLang(lang);
    saveLanguagePreference(lang);
  }, []);

  const handleModeChange = useCallback((mode: UserRole) => {
    setCurrentMode(mode);
    setStoredRole(mode);
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`;
          setSearchLocation(coords);
          changeLocation(coords);
        },
        () => {
          changeLocation(DEFAULT_LOCATION.fullName);
        }
      );
    }
  }, [changeLocation]);

  const handleVoiceQuery = useCallback(() => {
    startListening((transcript) => {
      setSearchLocation(transcript);
      changeLocation(transcript);
    });
  }, [startListening, changeLocation]);

  const handleSendPromptFromDashboard = useCallback(
    (promptText: string) => {
      setIsChatOpen(true);
      sendMessage(promptText);
    },
    [sendMessage]
  );

  return (
    <div className="app-shell min-h-screen bg-background font-body-md text-on-surface antialiased">
      {/* 1. SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col justify-between w-64 shrink-0 bg-surface-container-lowest shadow-sm z-30 overflow-y-auto border-r border-surface-container-high select-none sticky top-0 h-screen">
        <div className="p-space-md">
          {/* Logo Header */}
          <div className="flex items-center gap-space-sm pb-space-md border-b border-surface-container-high">
            <div className="h-9 w-9 rounded-lg bg-primary-fixed/40 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-[22px]">cyclone</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">WeatherGPT</span>
                <span className="font-label-mono-sm text-[10px] px-1.5 py-0.2 rounded bg-primary-fixed/40 text-primary font-bold">
                  AI-OPS
                </span>
              </div>
              <span className="font-label-mono-sm text-[10px] text-outline tracking-wider uppercase">
                IMD Copilot • MoES
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="pt-space-md">
            <span className="font-label-mono-bold text-label-mono-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">
              Intelligence Core
            </span>
            <nav className="flex flex-col gap-1">
              {[
                { id: 'dashboard', label: 'Live Telemetry', icon: 'sensors' },
                { id: 'map', label: 'Radar & Maps', icon: 'radar' },
                { id: 'route', label: 'Route Intel', icon: 'alt_route' },
                { id: 'alerts', label: 'Severe Alerts', icon: 'warning' },
                { id: 'settings', label: 'System Settings', icon: 'tune' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                    activeTab === item.id
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="font-body-md text-body-md">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Operational Modes Rail */}
          <div className="pt-space-md">
            <span className="font-label-mono-bold text-label-mono-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">
              Operational Modes
            </span>
            <div className="flex flex-col gap-1">
              {[
                { id: 'farmer', label: 'Kisan / Agri', icon: 'agriculture' },
                { id: 'aviation', label: 'Aviation Synoptic', icon: 'flight' },
                { id: 'smartcity', label: 'Smart City Matrix', icon: 'location_city' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id as UserRole)}
                  className={`w-full flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                    currentMode === m.id
                      ? 'bg-surface-container-high text-primary font-bold'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                    <span className="font-body-sm text-body-sm">{m.label}</span>
                  </div>
                  {currentMode === m.id && <span className="w-2 h-2 rounded-full bg-radar-emerald animate-pulse"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Tools */}
          <div className="pt-space-md">
            <span className="font-label-mono-bold text-label-mono-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">
              Advanced Tools
            </span>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSimModalOpen(true)}
                className="flex w-full items-center gap-2 px-space-sm py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">cyclone</span>
                <span>Disaster Simulator</span>
              </button>
              <button
                onClick={() => setEmergencyModalOpen(true)}
                className="flex w-full items-center gap-2 px-space-sm py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-600/10 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">phone_in_talk</span>
                <span>Emergency Center</span>
              </button>
              <button
                onClick={() => setClimateModalOpen(true)}
                className="flex w-full items-center gap-2 px-space-sm py-1.5 rounded-lg text-xs font-semibold text-atmospheric-cyan hover:bg-cyan-500/10 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>Climate Insights</span>
              </button>
              <button
                onClick={() => setReportModalOpen(true)}
                className="flex w-full items-center gap-2 px-space-sm py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Photo Weather AI Card */}
        <div className="p-space-md bg-surface-container-low rounded-t-xl mx-space-sm mb-space-sm border border-surface-container-high">
          <div className="flex items-center gap-space-xs mb-1">
            <span className="material-symbols-outlined text-primary text-[20px]">photo_camera</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Photo Weather AI</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm leading-relaxed">
            Upload sky snapshots for automated cloud vector &amp; optical barometry estimation.
          </p>
          <Link
            href="/photo-analysis"
            className="w-full flex items-center justify-center gap-space-xs py-2 px-space-sm rounded-lg bg-primary text-on-primary font-body-sm text-body-sm hover:bg-primary-container transition shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
            <span>Analyze Cloudscape</span>
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER & TOP HEADER */}
      <div className="main-content flex flex-col min-h-screen bg-background w-full min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-14 bg-surface-glass backdrop-blur-xl border-b border-surface-container-high shadow-xs flex items-center justify-between px-space-md md:px-space-lg w-full shrink-0">
          {/* Universal Search Bar */}
          <div className="flex items-center gap-space-sm flex-1 max-w-xl mr-2">
            <div className="relative flex-1 flex items-center bg-surface-container-low rounded-lg px-space-sm py-1.5 border border-surface-container-high focus-within:border-primary transition">
              <span className="material-symbols-outlined text-outline text-[20px] mr-space-xs">search</span>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    changeLocation(searchLocation);
                  }
                }}
                placeholder="Search Observatory, City or Coordinates (Default: Nashik)..."
                className="bg-transparent border-0 outline-none w-full font-body-sm text-body-sm text-on-surface placeholder:text-outline"
              />
              <button
                onClick={handleUseCurrentLocation}
                disabled={weatherLoading}
                title="Acquire Current GPS Fix"
                className="flex items-center gap-space-xs px-2 py-1 rounded bg-surface-container-highest text-on-surface hover:bg-primary hover:text-on-primary transition cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">my_location</span>
                <span className="font-label-mono-sm text-label-mono-sm font-bold">GPS</span>
              </button>
            </div>
          </div>

          {/* Right Header Strip */}
          <div className="flex items-center gap-2 md:gap-space-md">
            {/* WIS Telemetry */}
            <div className="hidden xl:flex items-center gap-space-xs px-space-sm py-1.5 rounded-full bg-surface-container-high border border-surface-container">
              <span className="w-2 h-2 rounded-full bg-radar-emerald animate-ping"></span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface">
                WIS 2.0 / MQTT: <span className="text-primary font-bold">ACTIVE {weather?.wis2_telemetry?.latency_ms ?? 12}ms</span>
              </span>
              <span className="text-outline font-label-mono-sm text-label-mono-sm">• Online</span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-space-xs px-2 py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">translate</span>
              <select
                value={currentLang}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-transparent border-0 outline-none font-body-sm text-body-sm text-on-surface cursor-pointer pr-1"
              >
                <option value="en">EN (English)</option>
                <option value="hi">HI (हिंदी)</option>
                <option value="mr">MR (मराठी)</option>
                <option value="ta">TA (தமிழ்)</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Pill */}
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-space-xs pl-space-xs cursor-pointer hover:opacity-90 transition"
            >
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                  {currentUser ? currentUser.name : 'Guest Explorer'}
                </span>
                <span className="font-label-mono-sm text-label-mono-sm text-outline">
                  {currentUser ? currentUser.role.toUpperCase() : 'IMD-CIVIL-PUBLIC'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden flex bg-surface-container-lowest border-b border-surface-container-high p-2 overflow-x-auto whitespace-nowrap select-none shrink-0">
          <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'dashboard' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Live Telemetry</button>
          <button onClick={() => setActiveTab('map')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'map' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Radar &amp; Maps</button>
          <button onClick={() => setActiveTab('route')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'route' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Route Intel</button>
          <button onClick={() => setActiveTab('alerts')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'alerts' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Severe Alerts</button>
          <button onClick={() => setActiveTab('settings')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'settings' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Settings</button>
        </div>

        {/* Dynamic Main View Router */}
        <main className="flex-1 min-w-0 w-full bg-background">
          {activeTab === 'dashboard' && (
            <DashboardView
              weather={weather}
              risk={risk}
              loading={weatherLoading}
              error={weatherError}
              activeModel={activeModel}
              currentMode={currentMode}
              currentLang={currentLang}
              onSelectHub={(hub) => {
                setSearchLocation(hub);
                changeLocation(hub);
              }}
              onSelectModel={changeModel}
              onSelectMode={handleModeChange}
              onRefresh={refreshWeather}
              onVoiceQuery={handleVoiceQuery}
              onSendChatPrompt={handleSendPromptFromDashboard}
            />
          )}

          {activeTab === 'map' && (
            <div className="p-space-md lg:p-space-lg flex flex-col gap-space-md">
              <WeatherMap
                activeLayer="temp"
                searchCenter={[
                  weather?.coordinates?.lat || DEFAULT_LOCATION.lat,
                  weather?.coordinates?.lon || DEFAULT_LOCATION.lon,
                ]}
                activeLocation={weather?.location || DEFAULT_LOCATION.fullName}
              />
            </div>
          )}

          {activeTab === 'route' && (
            <RouteView initialFrom={weather?.location || 'Nashik'} initialTo="Mumbai" />
          )}

          {activeTab === 'alerts' && (
            <AlertsView
              weather={weather}
              loading={weatherLoading}
              error={weatherError}
              onRefresh={refreshWeather}
              onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentLang={currentLang}
              currentMode={currentMode}
              activeModel={activeModel}
              currentUser={currentUser}
              onLanguageChange={handleLanguageChange}
              onModeChange={handleModeChange}
              onModelChange={changeModel}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Floating Chat Copilot Trigger Button */}
      <aside aria-label="Synoptic Copilot Chat Trigger" className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
          title="Open AI Weather Copilot"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </aside>

      {/* Slide-Over AI Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        loading={chatLoading}
        currentLocation={location}
        currentRole={currentMode}
        currentLang={currentLang}
        onSendMessage={sendMessage}
        onClearChat={clearChat}
        isListening={isListening}
        isSpeaking={isSpeaking}
        onStartListening={() => {
          startListening((transcript) => {
            sendMessage(transcript);
          });
        }}
        onStopListening={stopListening}
        onSpeakText={speak}
        onStopSpeaking={stopSpeaking}
      />

      {/* Development Mode Weather Data Debug Panel */}
      <WeatherDebugPanel weather={weather} loading={weatherLoading} />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser ? {
          name: currentUser.name,
          email: currentUser.email || '',
          role: currentUser.role as 'general' | 'farmer',
          isGuest: !currentUser.email,
        } : null}
        onLogin={(user) => {
          const userProfile: UserProfile = {
            name: user.name,
            email: user.email,
            role: (user.role as UserRole) || 'general',
          };
          setCurrentUser(userProfile);
          setStoredUser(userProfile);
          if (user.role) handleModeChange(user.role as UserRole);
          setAuthModalOpen(false);
        }}
        onLogout={() => {
          setCurrentUser(null);
          removeStoredUser();
          handleModeChange('general');
          setAuthModalOpen(false);
        }}
        lang={currentLang}
      />

      <DisasterSimulationModal
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        lang={currentLang}
      />

      <EmergencyCenterModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        location={weather?.location || DEFAULT_LOCATION.fullName}
        lang={currentLang}
      />

      <ClimateInsightsModal
        isOpen={climateModalOpen}
        onClose={() => setClimateModalOpen(false)}
        location={weather?.location || DEFAULT_LOCATION.fullName}
        lang={currentLang}
      />

      <ReportGeneratorModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        location={weather?.location || DEFAULT_LOCATION.fullName}
        weatherData={weather}
        lang={currentLang}
      />
    </div>
  );
}
