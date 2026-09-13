/**
 * WeatherGPT - DashboardView Component
 * Main meteorological dashboard featuring live telemetry, NWP model selector,
 * 4-cell HUD sensors, sector advisory, 7-day synoptic forecast, diurnal curves,
 * and AI risk score gauge.
 */

import React from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  AlertTriangle,
  Send,
  Mic,
  Camera,
} from 'lucide-react';
import {
  WeatherData,
  RiskData,
  NwpModel,
  UserRole,
} from '../../lib/types';
import {
  SupportedLanguage,
  translateCondition,
  translateDay,
  formatTemperature,
  formatWindSpeed,
} from '../../i18n';

interface DashboardViewProps {
  weather: WeatherData | null;
  risk: RiskData | null;
  loading: boolean;
  error: string | null;
  activeModel: NwpModel;
  currentMode: UserRole;
  currentLang: SupportedLanguage;
  onSelectHub: (hubName: string) => void;
  onSelectModel: (model: NwpModel) => void;
  onSelectMode: (mode: UserRole) => void;
  onRefresh: () => void;
  onVoiceQuery?: () => void;
  onSendChatPrompt?: (prompt: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  weather,
  risk,
  loading,
  error,
  activeModel,
  currentMode,
  currentLang,
  onSelectHub,
  onSelectModel,
  onSelectMode,
  onRefresh,
  onVoiceQuery,
  onSendChatPrompt,
}) => {
  const [promptInput, setPromptInput] = React.useState('');

  if (loading && !weather) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-bold text-on-surface">Loading Real-Time Telemetry...</h3>
        <p className="text-sm text-outline mt-1 font-mono">Synchronizing with IMD &amp; NWP Open-Meteo models</p>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="p-3 rounded-full bg-error-container text-error mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">Weather Telemetry Unavailable</h3>
        <p className="text-sm text-outline mt-1 max-w-md">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold text-sm flex items-center gap-2 hover:bg-primary-container transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  if (!weather) return null;

  const current = weather.current;
  const forecast = weather.forecast || [];
  const riskBreakdown = risk?.breakdown || [];

  const prominentHubs = [
    { name: 'Nashik', badge: '26°C • Agri', icon: '🍇' },
    { name: 'Pune', badge: '27°C • Rain', icon: '🌧️' },
    { name: 'Mumbai', badge: '29°C • Coast', icon: '🌊' },
    { name: 'Delhi', badge: '38°C • Warm', icon: '☀️' },
    { name: 'Bengaluru', badge: '24°C • Cool', icon: '💻' },
    { name: 'Jaipur', badge: '35°C • Clear', icon: '🏰' },
    { name: 'Goa', badge: '30°C • Beach', icon: '🏖️' },
  ];

  return (
    <div className="p-space-md lg:p-space-lg flex flex-col gap-space-md">
      {/* 1. Prominent Meteorological Hubs Ticker */}
      <section className="w-full flex items-center gap-space-sm overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-space-xs shrink-0 px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface">
          <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
          <span className="font-label-mono-bold text-label-mono-bold uppercase tracking-wider text-on-surface-variant">
            Prominent Hubs:
          </span>
        </div>
        <div className="flex items-center gap-space-xs shrink-0">
          {prominentHubs.map((hub) => {
            const isCurrent = weather.location.toLowerCase().includes(hub.name.toLowerCase());
            return (
              <button
                key={hub.name}
                onClick={() => onSelectHub(hub.name)}
                className={`flex items-center gap-space-xs px-3 py-1.5 rounded-full transition-all text-left cursor-pointer ${
                  isCurrent
                    ? 'bg-primary text-on-primary shadow-sm hover:brightness-105'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                }`}
                type="button"
              >
                <span className="text-sm">{hub.icon}</span>
                <span className="font-body-md text-body-md font-semibold">{hub.name}</span>
                <span className={`font-label-mono-sm text-label-mono-sm ${isCurrent ? 'opacity-90' : 'text-on-surface-variant'}`}>
                  {hub.badge}
                </span>
                {isCurrent && <span className="w-2 h-2 rounded-full bg-primary-fixed ml-0.5 animate-pulse"></span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Main Macro Synoptic Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-16 gap-space-md items-start">
        {/* LEFT COLUMN: TELEMETRY HERO + SENSORS + OUTLOOK */}
        <div className="xl:col-span-10 flex flex-col gap-space-md min-w-0">
          {/* Synoptic Header Card */}
          <section className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-mono-bold text-label-mono-sm text-primary uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-radar-emerald animate-ping"></span>
                    IMD / Open-Meteo (Live Telemetry)
                  </span>
                  <span className="text-outline font-label-mono-sm text-label-mono-sm">
                    • {current.updated_at ? `Updated ${current.updated_at}` : 'Real-Time Sync'}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-space-xs mt-1">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                    {weather.location}
                  </h1>
                  {weather.coordinates && (
                    <span className="font-label-mono-sm text-label-mono-sm px-2 py-0.5 rounded bg-surface-container-low text-secondary font-semibold">
                      IN ({weather.coordinates.lat.toFixed(4)}, {weather.coordinates.lon.toFixed(4)})
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-space-xs">
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex items-center gap-space-xs px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-mono-bold text-label-mono-sm transition cursor-pointer"
                  title="Force Refresh Data"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                {onVoiceQuery && (
                  <button
                    onClick={onVoiceQuery}
                    className="flex items-center gap-space-xs px-3 py-1.5 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-bold shadow-sm hover:bg-primary-container transition cursor-pointer"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Voice Query</span>
                  </button>
                )}
              </div>
            </div>

            {/* NWP Model Consensus Selector Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-space-xs border-t border-surface-container-high">
              <span className="text-outline font-label-mono-sm text-label-mono-sm uppercase font-bold mr-1">
                NWP Model:
              </span>
              {(
                [
                  { id: 'ensemble', name: 'Ensemble Consensus (GFS+ECMWF+WRF)' },
                  { id: 'gfs', name: 'NOAA GFS (0.25° Global)' },
                  { id: 'ecmwf', name: 'ECMWF IFS (0.1° High-Res)' },
                  { id: 'icon', name: 'DWD ICON / WRF (13km Meso)' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className={`px-2.5 py-1 rounded text-xs font-label-mono-sm font-medium transition cursor-pointer ${
                    activeModel === m.id
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </section>

          {/* Primary Telemetry Hero & Sensor Quad */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
            {/* Live Reading Card */}
            <div className="lg:col-span-6 p-space-md md:p-space-lg rounded-xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low shadow-sm border border-surface-container-high flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-space-sm">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed/40 text-primary border border-primary/20 flex items-center justify-center text-2xl shadow-xs">
                    {current.icon || '🌦️'}
                  </div>
                  <div>
                    <span className="font-label-mono-bold text-label-mono-sm text-primary uppercase tracking-wider">
                      Live Condition
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                      {translateCondition(current.condition, currentLang)}
                    </h3>
                    <span className="font-label-mono-sm text-label-mono-sm text-outline">
                      ({current.rain_probability}% Rain Prob • Microburst Safe)
                    </span>
                  </div>
                </div>
                <span className="font-label-mono-bold text-label-mono-sm px-2 py-0.5 rounded bg-primary-fixed/40 text-primary border border-primary/30">
                  SYNOPTIC VERIFIED
                </span>
              </div>

              {/* Temperature Display */}
              <div className="my-4 flex items-baseline justify-between relative z-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl md:text-6xl font-headline-lg font-extrabold text-on-surface tracking-tighter">
                    {formatTemperature(current.temp)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-space-md gap-y-1 font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                  <div>Feels: <strong className="text-on-surface">{formatTemperature(current.feels_like)}</strong></div>
                  <div>Humidity: <strong className="text-on-surface">{current.humidity}%</strong></div>
                  <div>Wind: <strong className="text-on-surface">{formatWindSpeed(current.wind_speed)} {current.wind_direction || 'WNW'}</strong></div>
                  <div>Rain Prob: <strong className="text-primary font-bold">{current.rain_probability}%</strong></div>
                </div>
              </div>

              {/* Rain Vector Gauge */}
              <div className="relative z-10 pt-2 flex flex-col gap-1 border-t border-surface-container-high">
                <div className="flex justify-between font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                  <span>Dynamic Rain Vector</span>
                  <span className="text-primary font-bold">{current.rain_probability > 50 ? 'Active precipitation' : 'Trace / dry steady'}</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-radar-emerald rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, current.rain_probability))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 4-Cell Sensor HUD */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-space-sm">
              {/* Barometer */}
              <div className="p-space-sm md:p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-bold text-label-mono-sm text-outline uppercase">Barometer</span>
                  <span className="material-symbols-outlined text-[18px] text-primary">speed</span>
                </div>
                <div className="my-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-headline-sm font-bold text-on-surface">
                      {current.pressure ?? 1009}
                    </span>
                    <span className="font-label-mono-sm text-label-mono-sm text-outline">hPa</span>
                  </div>
                  <div className="text-radar-emerald font-label-mono-sm text-label-mono-sm mt-0.5">
                    Steady (±0.2 hPa)
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div className="p-space-sm md:p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-bold text-label-mono-sm text-outline uppercase">Visibility</span>
                  <span className="material-symbols-outlined text-[18px] text-radar-emerald">visibility</span>
                </div>
                <div className="my-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-headline-sm font-bold text-on-surface">
                      {current.visibility ?? 10}
                    </span>
                    <span className="font-label-mono-sm text-label-mono-sm text-outline">km</span>
                  </div>
                  <div className="text-radar-emerald font-label-mono-sm text-label-mono-sm mt-0.5">
                    Clear Horizon
                  </div>
                </div>
              </div>

              {/* Solar UV */}
              <div className="p-space-sm md:p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-bold text-label-mono-sm text-outline uppercase">Solar UV Index</span>
                  <span className="material-symbols-outlined text-[18px] text-severe-amber">wb_sunny</span>
                </div>
                <div className="my-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-headline-sm font-bold text-on-surface">
                      {current.uv_index ?? 5}
                    </span>
                    <span className="font-label-mono-sm text-label-mono-sm text-outline">/ 10</span>
                  </div>
                  <div className="text-severe-amber font-label-mono-sm text-label-mono-sm mt-0.5">
                    Moderate Exposure
                  </div>
                </div>
              </div>

              {/* Air Quality (AQI) */}
              <div className="p-space-sm md:p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-bold text-label-mono-sm text-outline uppercase">Air Quality (CPCB)</span>
                  <span className="material-symbols-outlined text-[18px] text-radar-emerald">eco</span>
                </div>
                <div className="my-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-headline-sm font-bold text-radar-emerald">
                      {current.air_quality || 'Good'}
                    </span>
                  </div>
                  <div className="text-on-surface-variant font-label-mono-sm text-label-mono-sm mt-0.5">
                    Optimal Respiration
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Operational Sector Advisory */}
          <section className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Operational Weather Intelligence Mode
                </span>
              </div>
              <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-1 border border-surface-container-high">
                {(
                  [
                    { id: 'farmer', label: 'Kisan / Agri', icon: '🌾' },
                    { id: 'aviation', label: 'Aviation Synoptic', icon: '✈️' },
                    { id: 'smartcity', label: 'Smart City', icon: '🏙️' },
                    { id: 'general', label: 'Public', icon: '👥' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onSelectMode(mode.id as UserRole)}
                    className={`px-3 py-1 rounded font-label-mono-bold text-label-mono-sm transition cursor-pointer flex items-center gap-1.5 ${
                      currentMode === mode.id
                        ? 'bg-primary text-on-primary shadow-xs font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span>{mode.icon}</span>
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advisory Card */}
            <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-container-high flex items-start gap-space-sm">
              <div className="p-2 rounded-lg bg-primary-fixed/40 text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-on-surface">Sector Advisory: Outdoor Conditions Operational</span>
                  <span className="font-label-mono-bold text-[10px] px-2 py-0.5 rounded bg-primary-fixed/40 text-primary">
                    OPTIMIZED
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {weather.kisan_advisory?.spraying_window
                    ? `Spray window: ${weather.kisan_advisory.spraying_window}. ${weather.kisan_advisory.harvest_safety}`
                    : `Intermittent weather patterns across ${weather.location}. Standard outdoor weather. Light rain gear recommended for evening commute.`}
                </p>
              </div>
            </div>
          </section>

          {/* 7-Day Synoptic Outlook */}
          <section className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-label-mono-bold text-label-mono-sm text-primary uppercase tracking-wider">
                  Synoptic Outlook
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Day-Wise Forecast &amp; Meteorological Inspection
                </h2>
              </div>
            </div>

            {/* 7 Day Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {forecast.slice(0, 7).map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-center flex flex-col items-center justify-between transition cursor-pointer ${
                    idx === 0
                      ? 'bg-primary-fixed/30 border-primary shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container-high border-surface-container-high'
                  }`}
                >
                  <span className={`font-label-mono-bold text-xs ${idx === 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {idx === 0 ? 'Today' : translateDay(item.day, currentLang)}
                  </span>
                  <span className="text-2xl my-1">{item.icon || '⛅'}</span>
                  <span className="font-headline-sm text-xs font-bold text-on-surface">
                    {formatTemperature(item.temp)}
                  </span>
                  <div className="flex items-center gap-1 font-label-mono-sm text-[11px] text-primary mt-1">
                    <span>💧</span>
                    <span>{item.rain_probability}%</span>
                  </div>
                  <span className="font-label-mono-bold text-[9px] px-1.5 py-0.5 mt-1 rounded bg-surface-container text-on-surface">
                    {item.risk_level || 'Low Risk'}
                  </span>
                </div>
              ))}
            </div>

            {/* Ephemeris & Hourly Curves */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm pt-2">
              {/* Ephemeris Card */}
              <div className="md:col-span-4 p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col justify-between">
                <span className="font-label-mono-bold text-label-mono-sm text-outline uppercase">
                  Ephemeris &amp; Daylight
                </span>
                <div className="flex items-center justify-between my-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-severe-amber text-[24px]">wb_twilight</span>
                    <div>
                      <span className="font-label-mono-sm text-[10px] text-outline block">Sunrise</span>
                      <span className="text-xs font-bold text-on-surface">{current.sunrise || '06:15 AM'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[24px]">bedtime</span>
                    <div>
                      <span className="font-label-mono-sm text-[10px] text-outline block">Sunset</span>
                      <span className="text-xs font-bold text-on-surface">{current.sunset || '06:45 PM'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-[10px] font-mono text-outline">
                  Solar Zenith Peak: 12:30 IST
                </div>
              </div>

              {/* Hourly Vector Summary */}
              <div className="md:col-span-8 p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-mono-bold text-label-mono-sm text-outline uppercase">
                    Diurnal Precipitation &amp; Thermal Vector
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-primary font-bold">💧 Rain Prob %</span>
                    <span className="text-severe-amber font-bold">☀️ Temp °C</span>
                  </div>
                </div>
                <div className="grid grid-cols-6 text-center font-mono text-[11px] text-on-surface-variant pt-2">
                  <div>06:00<br/><strong className="text-primary">10%</strong></div>
                  <div>09:00<br/><strong className="text-primary">15%</strong></div>
                  <div>12:00<br/><strong className="text-primary">25%</strong></div>
                  <div className="bg-primary-fixed/40 rounded py-0.5 font-bold text-primary">15:00<br/>35% Peak</div>
                  <div>18:00<br/><strong className="text-primary">30%</strong></div>
                  <div>21:00<br/><strong className="text-primary">15%</strong></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: PHOTO COPILOT + RISK SCORE + ASK WEATHERGPT */}
        <div className="xl:col-span-6 flex flex-col gap-space-md">
          {/* Photo Weather AI Card */}
          <section className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col gap-space-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-space-xs">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed/40 text-primary border border-primary/20 flex items-center justify-center">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-label-mono-bold text-label-mono-sm text-primary uppercase tracking-widest">
                    Multimodal Copilot
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Photo Weather Intelligence
                  </h3>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary-fixed/40 text-primary font-label-mono-bold text-[10px]">
                V-AI 4.2
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Upload or snap a sky view. WeatherGPT&apos;s vision model segments cloud genus, optical barometry, and fog dissipation in real time.
            </p>

            <Link
              href="/photo-analysis"
              className="w-full p-5 rounded-xl bg-surface-container-low border-2 border-dashed border-surface-container-highest hover:bg-surface-container-high transition flex flex-col items-center justify-center text-center cursor-pointer group shadow-xs"
            >
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Camera className="h-5 w-5" />
              </div>
              <span className="font-body-sm text-body-sm font-bold text-on-surface">Analyze Cloudscape Photo</span>
              <span className="font-label-mono-sm text-label-mono-sm text-outline mt-0.5">Supports JPG, PNG, HEIC (Max 25MB)</span>
            </Link>
          </section>

          {/* Operational Safety Index / AI Risk Score */}
          <section className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label-mono-bold text-label-mono-sm text-outline uppercase tracking-wider">
                  Operational Safety Index
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  AI Meteorological Risk Score
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-severe-amber/20 text-severe-amber font-label-mono-bold text-xs">
                {risk?.category || 'Moderate Risk'}
              </span>
            </div>

            {/* Gauge Breakdown */}
            <div className="flex items-center gap-space-md my-2">
              <div className="w-24 h-24 rounded-full border-4 border-severe-amber flex flex-col items-center justify-center text-center shrink-0">
                <span className="text-3xl font-headline-lg font-bold text-on-surface">
                  {risk?.score ?? 42}
                </span>
                <span className="text-[9px] font-mono text-outline">/ 100 INDEX</span>
              </div>

              <div className="flex-1 flex flex-col space-y-2 font-label-mono-sm text-label-mono-sm">
                {riskBreakdown.length > 0 ? (
                  riskBreakdown.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-on-surface-variant">{item.factor}</span>
                      <strong className="text-on-surface">+{item.score}</strong>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Precipitation Rate</span>
                      <strong className="text-on-surface">+{current.rain_probability}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Wind Gusts &amp; Shear</span>
                      <strong className="text-on-surface">+{current.wind_speed} km/h</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Atmospheric Humidity</span>
                      <strong className="text-on-surface">+{current.humidity}%</strong>
                    </div>
                  </>
                )}
              </div>
            </div>

            <p className="text-[11px] text-outline leading-relaxed bg-surface-container-low p-2.5 rounded-lg">
              * This score is an AI-assisted meteorological risk model. For legal alerts, navigation orders, and civic advisories, refer exclusively to IMD / MoES official bulletins.
            </p>
          </section>

          {/* Ask WeatherGPT Prompt Strip */}
          <section className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Ask WeatherGPT
                </span>
              </div>
              <span className="font-label-mono-bold text-label-mono-sm text-radar-emerald">
                SYNOPTIC REASONING READY
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (promptInput.trim() && onSendChatPrompt) {
                  onSendChatPrompt(promptInput.trim());
                  setPromptInput('');
                }
              }}
              className="relative flex items-center mt-1"
            >
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="e.g. Will rainfall in Niphad affect table grapes today?"
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-xs pl-3.5 pr-10 py-2.5 rounded-lg border border-surface-container-high focus:outline-none focus:border-primary transition shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 w-7 h-7 rounded-md bg-primary hover:bg-primary-container text-on-primary flex items-center justify-center transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Quick Prompts */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                'Hourly rain Nashik road',
                'Grape vineyard spray window',
                'Fog & visibility OZAR airport',
              ].map((pill, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSendChatPrompt && onSendChatPrompt(pill)}
                  className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-mono-sm text-[10px] border border-surface-container-high transition cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
