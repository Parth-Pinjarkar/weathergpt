"use client";

import React, { useState } from 'react';
import { WeatherData } from '../lib/types';
import { DEFAULT_LOCATION } from '../constants/location';
import { Bug, X, ChevronDown, ChevronUp } from 'lucide-react';

interface WeatherDebugPanelProps {
  weather: WeatherData | null;
  loading: boolean;
}

export const WeatherDebugPanel: React.FC<WeatherDebugPanelProps> = ({ weather, loading }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // In production builds, this component is never rendered
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!weather && !loading) return null;

  const current = weather?.current;
  const lat = weather?.coordinates?.lat ?? DEFAULT_LOCATION.lat;
  const lon = weather?.coordinates?.lon ?? DEFAULT_LOCATION.lon;
  const locationName = weather?.location ?? DEFAULT_LOCATION.fullName;

  return (
    <div className="fixed bottom-4 left-4 z-50 font-mono text-xs">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-emerald-400 border border-emerald-500/40 shadow-xl hover:bg-slate-800 transition cursor-pointer"
          title="Open Weather Data Debug Panel (Dev Mode Only)"
        >
          <Bug className="h-3.5 w-3.5" />
          <span className="font-bold">Weather Debug</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-800 text-slate-200 shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-slate-100">WEATHER DATA DEBUG</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                DEV ONLY
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                {isMinimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-4 space-y-2.5 max-h-[380px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-2">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Provider</span>
                  <span className="font-bold text-emerald-400">{current?.source || 'Open-Meteo NWP'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Location</span>
                  <span className="font-bold text-slate-200 truncate block">{locationName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Latitude</span>
                  <span className="text-slate-300 font-semibold">{lat.toFixed(4)}° N</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Longitude</span>
                  <span className="text-slate-300 font-semibold">{lon.toFixed(4)}° E</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-2">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">API Field (Temp)</span>
                  <span className="text-cyan-400">current.temperature_2m</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">API Field (Feels)</span>
                  <span className="text-cyan-400">current.apparent_temp</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Raw Temperature</span>
                  <span className="font-extrabold text-amber-300 text-sm">{current?.temp ?? 'N/A'}°C</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Raw Feels Like</span>
                  <span className="font-extrabold text-slate-300 text-sm">{current?.feels_like ?? 'N/A'}°C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-2">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Relative Humidity</span>
                  <span className="text-slate-200">{current?.humidity ?? 'N/A'}%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Wind Velocity</span>
                  <span className="text-slate-200">{current?.wind_speed ?? 'N/A'} km/h</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Precipitation Prob</span>
                  <span className="text-emerald-400 font-bold">{current?.rain_probability ?? 'N/A'}%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Telemetry Time</span>
                  <span className="text-slate-400">{current?.updated_at || 'Just Now'}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-1">
                Freshness: <span className="text-emerald-400 font-semibold">{loading ? 'Fetching...' : 'Synchronized Live'}</span> • Zero artificial offsets applied.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherDebugPanel;
