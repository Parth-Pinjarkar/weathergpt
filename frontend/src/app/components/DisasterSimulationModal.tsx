"use client";

import React, { useState } from 'react';
import { AlertTriangle, Sliders, X, ShieldAlert, Sparkles } from 'lucide-react';
import { LOCALIZATION, SupportedLanguage } from '../i18n';

interface ScenarioResult {
  title: string;
  simulated_hazard: string;
  baseline_risk: number;
  simulated_risk: number;
  risk_level: string;
  affected_zones: { name: string; risk: number; status: string }[];
  key_factors: { factor: string; score: number }[];
  ai_recommendation: string;
}

interface DisasterSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScenario?: (scenarioName: string) => void;
  lang?: SupportedLanguage;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DisasterSimulationModal({
  isOpen,
  onClose,
  onApplyScenario,
  lang = 'en'
}: DisasterSimulationModalProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'whatif'>('preset');
  const [selectedScenario, setSelectedScenario] = useState('HEAVY_RAIN');
  const [intensity] = useState(1.2);
  
  // What-If state
  const [rainDelta, setRainDelta] = useState(30);
  const [tempDelta, setTempDelta] = useState(2);
  const [windDelta, setWindDelta] = useState(15);

  const t = LOCALIZATION[lang] || LOCALIZATION.en;
  
  const getLocalizedDefaultSim = (l: SupportedLanguage): ScenarioResult => {
    if (l === 'hi') {
      return {
        title: "गंभीर भारी वर्षा सिमुलेशन",
        simulated_hazard: "बादल फटना व मूसलाधार बारिश",
        baseline_risk: 45,
        simulated_risk: 87,
        risk_level: "SEVERE",
        affected_zones: [
          { name: "लोनावला घाट", risk: 98, status: "रेड अलर्ट - भूस्खलन निगरानी" },
          { name: "पुणे मुला-मुथा नदी बेसिन", risk: 89, status: "रेड अलर्ट - जलभराव चेतावनी" },
          { name: "खोपोली घाटी", risk: 84, status: "ऑरेंज चेतावनी - फ्लैश फ्लड" }
        ],
        key_factors: [
          { factor: "अनुमानित वर्षा तीव्रता (+65 mm/hr)", score: 38 },
          { factor: "नदी जलस्तर वृद्धि (+2.4m खतरे से ऊपर)", score: 25 },
          { factor: "मृदा संतृप्ति सूचकांक", score: 24 }
        ],
        ai_recommendation: "स्थानीय आपदा प्रबंधन कक्ष को तुरंत सक्रिय करें। मुंबई-पुणे एक्सप्रेसवे पर यात्रा सावधानी परामर्श जारी करें।"
      };
    }
    if (l === 'mr') {
      return {
        title: "तीव्र मुसळधार पाऊस सिम्युलेशन",
        simulated_hazard: "ढगफुटी सदृश मुसळधार पाऊस",
        baseline_risk: 45,
        simulated_risk: 87,
        risk_level: "SEVERE",
        affected_zones: [
          { name: "लोणावळा घाट", risk: 98, status: "रेड अलर्ट - दरड कोसळण्याची दक्षता" },
          { name: "पुणे मुळा-मुठा नदी पात्र", risk: 89, status: "रेड अलर्ट - पूर चेतावणी" },
          { name: "खोपोली दरी", risk: 84, status: "ऑरेंज चेतावणी - अचानक पूर" }
        ],
        key_factors: [
          { factor: "अंदाजित पावसाची तीव्रता (+65 mm/hr)", score: 38 },
          { factor: "नदी जलपातळी वाढ (+2.4m धोक्याच्या वर)", score: 25 },
          { factor: "जमिनीतील आर्द्रता निर्देशांक", score: 24 }
        ],
        ai_recommendation: "स्थानिक आपत्ती निवारण पथके तत्काळ तैनात करा. मुंबई-पुणे द्रुतगती मार्गावर प्रवास खबरदारीचा इशारा जारी करा."
      };
    }
    return {
      title: "Severe Heavy Rain Simulation",
      simulated_hazard: "Cloudburst & Torrential Rainfall",
      baseline_risk: 45,
      simulated_risk: 87,
      risk_level: "SEVERE",
      affected_zones: [
        { name: "Lonavala Ghats", risk: 98, status: "Red Alert - Landslide Watch" },
        { name: "Pune Mula-Mutha River Basin", risk: 89, status: "Red Alert - Inundation Warning" },
        { name: "Khopoli Valley", risk: 84, status: "Orange Warning - Flash Flood" }
      ],
      key_factors: [
        { factor: "Simulated Rainfall Intensity (+65 mm/hr)", score: 38 },
        { factor: "River Level Water Rise (+2.4m above danger)", score: 25 },
        { factor: "Saturated Soil Moisture Index", score: 24 }
      ],
      ai_recommendation: "Activate local disaster cells immediately. Issue mandatory travel warnings on Mumbai-Pune Expressway."
    };
  };

  const [simResult, setSimResult] = useState<ScenarioResult | null>(getLocalizedDefaultSim(lang));

  if (!isOpen) return null;

  const handleRunPreset = async (scenario: string) => {
    setSelectedScenario(scenario);
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulation/disaster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, intensity })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data.result);
        if (onApplyScenario) onApplyScenario(scenario);
      }
    } catch {
      // Offline fallback
    }
  };

  const calculatedWhatIfScore = Math.min(100, Math.max(0, Math.round(35 + (rainDelta * 0.45) + (tempDelta * 3.5) + (windDelta * 0.8))));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl border border-rose-500/30 bg-slate-900 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-500/20 p-2.5 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-lg text-slate-100">
                  {t.sim_modal_title}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {t.badge_advanced_ai}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t.sim_modal_sub}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-3 gap-6">
          <button
            onClick={() => setActiveTab('preset')}
            className={`pb-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'preset' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            {t.sim_tab_preset}
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`pb-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'whatif' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" />
            {t.sim_tab_whatif}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'preset' ? (
            <div>
              <label className="text-xs font-black text-slate-200 block mb-3">{t.sim_select_scenario}</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
                {[
                  { id: 'HEAVY_RAIN', label: t.sim_scenario_rain },
                  { id: 'FLOOD', label: t.sim_scenario_flood },
                  { id: 'HEATWAVE', label: t.sim_scenario_heatwave },
                  { id: 'CYCLONE', label: t.sim_scenario_cyclone },
                  { id: 'THUNDERSTORM', label: t.sim_scenario_thunder }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleRunPreset(s.id)}
                    className={`p-3 rounded-xl border text-xs font-black transition-all text-center cursor-pointer shadow-sm ${
                      selectedScenario === s.id
                        ? 'bg-rose-600/30 border-rose-500 text-rose-300 ring-2 ring-rose-500/40 shadow-rose-500/10'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {simResult && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-black text-rose-400 text-base">{simResult.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Hazard: {simResult.simulated_hazard}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-rose-500">{simResult.simulated_risk}/100</span>
                      <p className="text-[10px] text-rose-400 font-extrabold uppercase">{simResult.risk_level} RISK</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-200 mb-2.5">{t.sim_affected_zones}</h4>
                    <div className="space-y-2">
                      {simResult.affected_zones.map((zone, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm">
                          <span className="font-bold text-slate-200">{zone.name}</span>
                          <span className="text-rose-400 font-black">{zone.status} ({zone.risk}/100)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Emergency Recommendation Box */}
                  <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-xl text-xs text-rose-200 shadow-sm">
                    <span className="font-black text-rose-400 block mb-1 text-xs">{t.sim_ai_rec}</span>
                    <p className="leading-relaxed font-medium">{simResult.ai_recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800 shadow-inner">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-200 mb-1.5">
                    <span>{t.sim_rain_increase}</span>
                    <span className="text-amber-400 font-black">+{rainDelta}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rainDelta}
                    onChange={(e) => setRainDelta(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-200 mb-1.5">
                    <span>{t.sim_temp_shift}</span>
                    <span className="text-amber-400 font-black">+{tempDelta}°C</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="10"
                    value={tempDelta}
                    onChange={(e) => setTempDelta(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-200 mb-1.5">
                    <span>{t.sim_wind_surge}</span>
                    <span className="text-amber-400 font-black">+{windDelta} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={windDelta}
                    onChange={(e) => setWindDelta(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 text-center shadow-sm">
                <p className="text-xs text-amber-400 uppercase font-black tracking-wider mb-1">{t.sim_hypo_risk}</p>
                <div className="text-4xl font-black text-amber-400 my-2">{calculatedWhatIfScore}/100</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {t.sim_hypo_desc}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950/80 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
          >
            {t.close_btn}
          </button>
        </div>
      </div>
    </div>
  );
}
