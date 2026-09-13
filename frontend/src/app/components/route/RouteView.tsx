/**
 * WeatherGPT - RouteView Component
 * Intelligent multi-point route weather analysis, hazard waypoint timelines,
 * and AI travel safety recommendations.
 */

import React, { useState } from 'react';
import {
  Navigation,
  ArrowRightLeft,
  Search,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { RouteAnalysisData } from '../../lib/types';
import { formatTemperature } from '../../i18n';

interface RouteViewProps {
  initialFrom?: string;
  initialTo?: string;
}

export const RouteView: React.FC<RouteViewProps> = ({
  initialFrom = 'Nashik',
  initialTo = 'Mumbai',
}) => {
  const [fromLocation, setFromLocation] = useState<string>(initialFrom);
  const [toLocation, setToLocation] = useState<string>(initialTo);
  const [routeData, setRouteData] = useState<RouteAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const popularRoutes = [
    { from: 'Nashik', to: 'Mumbai' },
    { from: 'Mumbai', to: 'Pune' },
    { from: 'Pune', to: 'Goa' },
    { from: 'Delhi', to: 'Jaipur' },
    { from: 'Bengaluru', to: 'Mysuru' },
  ];

  const analyzeRoute = async (from = fromLocation, to = toLocation) => {
    if (!from.trim() || !to.trim()) {
      setError('Please specify both departure and destination points.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.post<RouteAnalysisData>('/api/route/analyze', {
        from_location: from.trim(),
        to_location: to.trim(),
      });

      if (data && data.timeline) {
        setRouteData(data);
      } else {
        throw new Error('Route analysis telemetry returned invalid response format.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze route weather';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  return (
    <div className="w-full min-w-0 p-space-md lg:p-space-lg flex flex-col gap-space-md max-w-7xl mx-auto">
      {/* Route Query Formulation Card */}
      <section className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col gap-space-sm">
        <div className="flex items-center gap-space-xs mb-1">
          <Navigation className="h-5 w-5 text-primary" />
          <h1 className="font-headline-lg text-lg md:text-xl font-bold text-on-surface">
            Route Weather &amp; Synoptic Hazard Intelligence
          </h1>
        </div>
        <p className="text-xs md:text-sm text-on-surface-variant font-mono">
          Analyze corridor weather conditions, ghat passes, microbursts, and ghat fog risks across your travel route.
        </p>

        {/* Inputs Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            analyzeRoute();
          }}
          className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-2 items-center"
        >
          <div className="md:col-span-5 relative">
            <span className="absolute left-3 top-3 text-[10px] font-mono text-outline uppercase font-bold">From</span>
            <input
              type="text"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              placeholder="Origin (e.g. Nashik)"
              className="w-full bg-surface-container-low text-on-surface pt-6 pb-2 px-3 rounded-lg border border-surface-container-high focus:outline-none focus:border-primary text-xs font-semibold"
            />
          </div>

          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface transition cursor-pointer"
              title="Swap Origin and Destination"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="md:col-span-4 relative">
            <span className="absolute left-3 top-3 text-[10px] font-mono text-outline uppercase font-bold">To</span>
            <input
              type="text"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              placeholder="Destination (e.g. Mumbai)"
              className="w-full bg-surface-container-low text-on-surface pt-6 pb-2 px-3 rounded-lg border border-surface-container-high focus:outline-none focus:border-primary text-xs font-semibold"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>{loading ? 'Analyzing...' : 'Analyze'}</span>
            </button>
          </div>
        </form>

        {/* Popular Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-surface-container-high">
          <span className="text-[10px] font-mono uppercase text-outline font-bold mr-1">Popular Corridors:</span>
          {popularRoutes.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setFromLocation(r.from);
                setToLocation(r.to);
                analyzeRoute(r.from, r.to);
              }}
              className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-mono-sm text-[10px] border border-surface-container-high transition cursor-pointer"
            >
              {r.from} → {r.to}
            </button>
          ))}
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="p-8 rounded-xl bg-surface-container-lowest border border-surface-container-high text-center flex flex-col items-center justify-center shadow-sm">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-3" />
          <h3 className="font-bold text-on-surface text-base">Interpolating Route Telemetry...</h3>
          <p className="text-xs text-outline font-mono mt-1">
            Analyzing waypoints along {fromLocation} to {toLocation} corridor
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 rounded-xl bg-surface-container-lowest border border-error-container text-center flex flex-col items-center justify-center shadow-sm">
          <AlertTriangle className="h-8 w-8 text-error mb-2" />
          <h3 className="font-bold text-on-surface text-base">Route Analysis Failed</h3>
          <p className="text-xs text-outline mt-1 max-w-md">{error}</p>
          <button
            onClick={() => analyzeRoute()}
            className="mt-3 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold transition cursor-pointer"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* Results View */}
      {routeData && !loading && (
        <div className="flex flex-col gap-space-md">
          {/* Summary Banner */}
          <div className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex flex-wrap items-center justify-between gap-space-sm">
            <div>
              <span className="font-label-mono-bold text-[10px] text-outline uppercase tracking-wider">
                Corridor Risk Verdict
              </span>
              <h2 className="font-headline-sm text-base font-bold text-on-surface">
                {routeData.from_location} → {routeData.to_location}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-fixed/40 text-primary font-label-mono-bold text-xs border border-primary/20">
                Peak Risk: {routeData.highest_risk_level || 'Low Risk'}
              </span>
            </div>
          </div>

          {/* AI Travel Recommendation */}
          {routeData.ai_travel_recommendation && (
            <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary-fixed/40 text-primary shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wide">
                  AI Travel Safety Advisory
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {routeData.ai_travel_recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Waypoint Timeline */}
          <div className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex flex-col gap-space-sm">
            <h3 className="font-label-mono-bold text-xs text-outline uppercase tracking-wider">
              Corridor Waypoint Telemetry
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
              {routeData.timeline.map((point, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-outline block">Stop #{idx + 1}</span>
                      <h4 className="font-bold text-xs text-on-surface">{point.name}</h4>
                    </div>
                    <span className="text-lg">🌦️</span>
                  </div>

                  <div className="my-2 flex items-baseline justify-between font-mono text-xs">
                    <span className="text-on-surface font-bold">{formatTemperature(point.temp)}</span>
                    <span className="text-primary font-bold">💧 {point.rain_probability}% Rain</span>
                  </div>

                  <div className="text-[11px] text-on-surface-variant bg-surface-container-lowest p-1.5 rounded border border-surface-container-high">
                    {point.recommendation || 'Normal highway transit.'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteView;
