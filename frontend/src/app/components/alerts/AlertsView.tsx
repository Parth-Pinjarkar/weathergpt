/**
 * WeatherGPT - AlertsView Component
 * Severe weather alerts, IMD synoptic warnings, and disaster defense advisories.
 */

import React from 'react';
import {
  AlertTriangle,
  Shield,
  RefreshCw,
  PhoneCall,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { WeatherData } from '../../lib/types';

interface AlertsViewProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenEmergencyModal?: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  weather,
  loading,
  error,
  onRefresh,
  onOpenEmergencyModal,
}) => {
  if (loading && !weather) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-bold text-on-surface">Loading Severe Weather Alerts...</h3>
        <p className="text-sm text-outline mt-1 font-mono">Querying IMD synoptic warning bulletin</p>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="p-3 rounded-full bg-error-container text-error mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">Unable to Load Weather Alerts</h3>
        <p className="text-sm text-outline mt-1 max-w-md">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold text-sm flex items-center gap-2 hover:bg-primary-container transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const alerts = weather?.alerts || [];

  return (
    <div className="w-full min-w-0 p-space-md lg:p-space-lg flex flex-col gap-space-md max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-sm md:text-headline-lg text-on-surface font-bold">
              Severe Weather Intelligence
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant font-mono mt-0.5">
              IMD Synoptic Bulletin • Real-Time Flash Flood &amp; Microburst Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenEmergencyModal && (
            <button
              onClick={onOpenEmergencyModal}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Emergency Center</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface transition cursor-pointer"
            title="Refresh Alerts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Alerts List or Empty State */}
      {alerts.length === 0 ? (
        <div className="p-8 rounded-xl bg-surface-container-lowest border border-surface-container-high text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center mb-3">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">No Active Severe Alerts</h3>
          <p className="font-body-sm text-sm text-on-surface-variant max-w-md mt-1">
            Current atmospheric conditions across {weather?.location || 'this location'} are stable. No active red, orange, or cyclone warnings are issued by IMD.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface font-label-mono-sm text-xs border border-surface-container-high">
              ✓ Microburst: Low Risk
            </span>
            <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface font-label-mono-sm text-xs border border-surface-container-high">
              ✓ Lightning: Normal
            </span>
            <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface font-label-mono-sm text-xs border border-surface-container-high">
              ✓ Flood: Nil
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-space-sm">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest border-l-4 border-l-rose-500 border border-surface-container-high shadow-sm flex flex-col gap-space-sm"
            >
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-label-mono-bold text-xs border border-rose-500/20">
                    IMD WARNING
                  </span>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">{alert.title}</h3>
                </div>
                <span className="font-label-mono-sm text-xs text-outline">{alert.expected_period}</span>
              </div>

              {alert.impacts && alert.impacts.length > 0 && (
                <div>
                  <h4 className="font-label-mono-bold text-xs text-outline uppercase tracking-wider mb-1">
                    Expected Meteorological Impacts
                  </h4>
                  <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1">
                    {alert.impacts.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {alert.actions && alert.actions.length > 0 && (
                <div className="pt-2 border-t border-surface-container-high">
                  <h4 className="font-label-mono-bold text-xs text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Recommended Civic Precautions</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    {alert.actions.map((act, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-surface-container-low text-xs text-on-surface flex items-start gap-1.5"
                      >
                        <span className="text-primary font-bold">•</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Emergency Helpline Strip */}
      <div className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
          <Info className="h-4 w-4 text-secondary" />
          <span>National Emergency Response Helplines:</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface">
            National Disaster: <strong>1077</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface">
            Emergency Dispatch: <strong>112</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface">
            Ambulance: <strong>108</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AlertsView;
