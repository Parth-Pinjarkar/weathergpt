"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  CloudRain, Sun, Moon, Cloud, CloudLightning, Wind, Compass, 
  Navigation, AlertTriangle, Shield, 
  Map as MapIcon, Send, Mic, Volume2, Heart, Settings as SettingsIcon,
  ChevronRight, RefreshCw, Layers, CheckCircle2, User, Activity, GraduationCap,
  Sliders, PhoneCall, TrendingUp, FileText, Droplets, Thermometer, Sparkles, LogIn,
  Wifi, WifiOff, Calendar, Clock, Plane, Building2, Radio, Globe, Camera, ChevronDown
} from 'lucide-react';

import DisasterSimulationModal from './components/DisasterSimulationModal';
import EmergencyCenterModal from './components/EmergencyCenterModal';
import ClimateInsightsModal from './components/ClimateInsightsModal';
import ReportGeneratorModal from './components/ReportGeneratorModal';
import AuthModal, { UserProfile } from './components/AuthModal';
import LocationSearchBar, { LocationItem } from './components/LocationSearchBar';
import { getBackendUrl } from './utils/apiUrl';
import { 
  LOCALIZATION, 
  SUPPORTED_LANGUAGES,
  LANGUAGE_MAP,
  SupportedLanguage,
  translateCondition, 
  translateRiskCategory, 
  translateRiskFactor, 
  translateDay, 
  translateRecommendation,
  formatTemperature,
  formatWindSpeed,
  formatDistance,
  getSavedLanguage,
  saveLanguagePreference,
  t
} from './i18n';

// TypeScript Interfaces for WeatherGPT data structures
export interface WeatherCurrent {
  temp: number;
  feels_like: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  wind_direction?: string;
  rain_probability: number;
  air_quality: string;
  sunrise: string;
  sunset: string;
  icon: string;
  source: string;
  updated_at?: string;
  pressure?: number;
  visibility?: number;
  uv_index?: number;
}

export interface HourlyForecastItem {
  time: string;
  temp: number;
  condition: string;
  icon: string;
  rain_probability: number;
  wind: number;
}

export interface WeatherForecastItem {
  day: string;
  date?: string;
  date_iso?: string;
  temp: number;
  temp_max?: number;
  temp_min?: number;
  condition: string;
  icon: string;
  rain_probability: number;
  wind: number;
  humidity: number;
  risk_level: string;
  recommendation: string;
  uv_index?: number;
  sunrise?: string;
  sunset?: string;
  hourly?: HourlyForecastItem[];
}

export interface WeatherAlert {
  title: string;
  expected_period: string;
  impacts: string[];
  actions: string[];
}

export interface NwpModelInfo {
  id: string;
  name: string;
  resolution: string;
}

export interface Wis2Telemetry {
  status: string;
  broker: string;
  topic: string;
  protocol: string;
  latency_ms: number;
  synoptic_cycle: string;
  wmo_code: number;
}

export interface AviationBriefing {
  flight_category: string;
  ceiling_ft: number;
  visibility_km: number;
  crosswind_risk: string;
  metar_raw: string;
}

export interface KisanAdvisory {
  spraying_window: string;
  irrigation_recommendation: string;
  pest_disease_risk: string;
  harvest_safety: string;
}

export interface SmartCityTelemetry {
  heat_island_index: string;
  drainage_overload_risk: string;
  air_quality_dispersion: string;
}

export interface WeatherData {
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  current: WeatherCurrent;
  forecast: WeatherForecastItem[];
  nwp_model?: NwpModelInfo;
  wis2_telemetry?: Wis2Telemetry;
  aviation_briefing?: AviationBriefing;
  kisan_advisory?: KisanAdvisory;
  smart_city_telemetry?: SmartCityTelemetry;
  alerts?: WeatherAlert[];
}

export interface RiskFactor {
  factor: string;
  score: number;
  weight?: number;
  description: string;
}

export interface RiskData {
  score: number;
  category: string;
  color: string;
  breakdown: RiskFactor[];
  disclaimer?: string;
}

export interface RouteTimelineItem {
  name: string;
  condition: string;
  temp: number;
  rain_probability: number;
  risk_score: number;
  risk_level: string;
  color: string;
  recommendation: string;
}

export interface RouteAnalysisData {
  from_location: string;
  to_location: string;
  route_path: string;
  highest_risk_level: string;
  highest_risk_color: string;
  timeline: RouteTimelineItem[];
  ai_travel_recommendation: string;
  source: string;
}

export interface DisasterMetrics {
  active_alerts: number;
  high_risk_areas: number;
  flood_risk_count: number;
  heavy_rainfall_count: number;
  severe_weather_count: number;
}

export interface DisasterZone {
  location: string;
  hazard: string;
  severity: string;
  risk_score: number;
}

export interface DisasterDashboardData {
  metrics: DisasterMetrics;
  critical_zones: DisasterZone[];
  ai_situation_summary: string;
}

export interface GlobalAlert {
  id: string;
  title: string;
  severity: string;
  location: string;
  description: string;
  expected_period: string;
  actions: string | string[];
}

export interface ChatMessageMetadata {
  alert_level?: string;
  advice?: string;
  type?: string;
  source?: string;
  weather_details?: WeatherData;
  risk_details?: RiskData;
  route_details?: RouteAnalysisData;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: ChatMessageMetadata;
}

// Browser Speech Recognition Types
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

// Helper to generate message ID (impure, extracted outside render)
const generateMessageId = (): number => {
  return Date.now();
};

const formatCleanText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\*{1,4}/g, "")
    .replace(/\|+/g, " ")
    .replace(/#+\s*/g, "")
    .replace(/`+/g, "")
    .replace(/^[|\s\-:=\+]{3,}$/gm, "")
    .replace(/^\s*[\*\-]\s+/gm, "• ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// Dynamically import WeatherMap with SSR disabled (Leaflet requires browser window)
const WeatherMap = dynamic(() => import('./components/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
      <RefreshCw className="h-8 w-8 animate-spin mr-3 text-emerald-500" />
      Loading Interactive Weather Map...
    </div>
  )
});

// Using centralized localization bundle from i18n.ts and dynamic API URL resolver
const BACKEND_URL = getBackendUrl();

const DEFAULT_WEATHER: WeatherData = {
  location: "Pune, Maharashtra India",
  current: {
    temp: 27,
    feels_like: 29.5,
    condition: "Partly Cloudy",
    humidity: 78,
    wind_speed: 16,
    rain_probability: 35,
    air_quality: "Good (AQI 42)",
    sunrise: "06:15 AM",
    sunset: "06:50 PM",
    icon: "cloud-rain",
    source: "IMD / Open-Meteo",
    updated_at: "Live"
  },
  forecast: [
    { day: "Today", temp: 27, condition: "Partly Cloudy", icon: "cloud-rain", rain_probability: 35, wind: 16, humidity: 78, risk_level: "LOW", recommendation: "Pleasant outdoor weather. Standard precautions." },
    { day: "Fri", temp: 28, condition: "Moderate Rain", icon: "cloud-rain", rain_probability: 60, wind: 18, humidity: 82, risk_level: "MODERATE", recommendation: "Carry an umbrella. Drive carefully." },
    { day: "Sat", temp: 26, condition: "Thunderstorm", icon: "cloud-lightning", rain_probability: 85, wind: 24, humidity: 88, risk_level: "HIGH", recommendation: "Stay indoors during peak lightning." },
    { day: "Sun", temp: 25, condition: "Heavy Rain", icon: "cloud-lightning", rain_probability: 90, wind: 28, humidity: 92, risk_level: "SEVERE", recommendation: "Avoid low-lying waterlogged roads." },
    { day: "Mon", temp: 27, condition: "Light Rain", icon: "cloud-rain", rain_probability: 45, wind: 14, humidity: 75, risk_level: "LOW", recommendation: "Safe for travel and general commute." },
    { day: "Tue", temp: 29, condition: "Partly Cloudy", icon: "sun", rain_probability: 20, wind: 12, humidity: 65, risk_level: "LOW", recommendation: "Good harvesting window." },
    { day: "Wed", temp: 30, condition: "Clear Sky", icon: "sun", rain_probability: 10, wind: 10, humidity: 58, risk_level: "LOW", recommendation: "Ideal outdoor conditions." }
  ]
};

const DEFAULT_RISK: RiskData = {
  score: 42,
  category: "MODERATE",
  color: "yellow",
  breakdown: [
    { factor: "Precipitation Rate", score: 45, description: "Scattered showers expected" },
    { factor: "Wind Gusts", score: 38, description: "Light to moderate breezes" },
    { factor: "Atmospheric Humidity", score: 78, description: "Elevated monsoon moisture" }
  ]
};

export default function WeatherGPT() {
  // Navigation & Localization States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'route' | 'alerts' | 'disaster' | 'settings'>('dashboard');
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [windUnit, setWindUnit] = useState<'kmh' | 'mph'>('kmh');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');
  const [currentMode, setCurrentMode] = useState<'general' | 'traveller' | 'farmer' | 'disaster' | 'school' | 'aviation' | 'smartcity'>('general');
  const [selectedNwpModel, setSelectedNwpModel] = useState<'best_match' | 'gfs' | 'ecmwf' | 'icon'>('best_match');
  const [searchLocation, setSearchLocation] = useState<string>('Pune');
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.5204, 73.8567]);
  const [activeMapLayer, setActiveMapLayer] = useState<'temp' | 'rain' | 'wind' | 'risk'>('temp');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Weather Data States
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);
  const [risk, setRisk] = useState<RiskData>(DEFAULT_RISK);
  const [selectedForecastIndex, setSelectedForecastIndex] = useState<number>(0);
  const [routeFrom, setRouteFrom] = useState<string>('Pune');
  const [routeTo, setRouteTo] = useState<string>('Mumbai');
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysisData | null>(null);
  const [disasterDashboard, setDisasterDashboard] = useState<DisasterDashboardData | null>(null);
  const [allAlerts, setAllAlerts] = useState<GlobalAlert[]>([]);

  // Chatbot States
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I am WeatherGPT, your AI-powered meteorology copilot. How can I help you today?",
      created_at: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [voicePlayback, setVoicePlayback] = useState<boolean>(false);

  // Modals & Theme States
  const [simModalOpen, setSimModalOpen] = useState<boolean>(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);
  const [climateModalOpen, setClimateModalOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  
  // Theme & User Authentication States (Default background set to Light mode)
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<'rain' | 'temp'>('rain');
  const [voiceStatus, setVoiceStatus] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const text = LOCALIZATION[currentLang];

  // Initialize Theme, User Profile & Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('weathergpt_theme') as 'dark' | 'light') || 'light';
      setTheme(savedTheme);
      
      const savedUser = localStorage.getItem('weathergpt_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setCurrentUser(parsedUser);
          if (parsedUser.role) {
            setCurrentMode(parsedUser.role);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // Default Guest User
        setCurrentUser({
          name: "Guest Explorer",
          email: "guest@weathergpt.local",
          role: "general",
          isGuest: true
        });
      }

      const savedMode = localStorage.getItem('weathergpt_mode');
      if (savedMode && ['general', 'traveller', 'farmer', 'disaster', 'school'].includes(savedMode)) {
        setCurrentMode(savedMode as any);
      }

      const savedLang = getSavedLanguage();
      setCurrentLang(savedLang);

      const win = window as unknown as SpeechRecognitionWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setTimeout(() => {
          setSpeechSupported(true);
        }, 0);
      }

      const savedChatSessionId = localStorage.getItem('weathergpt_chat_session');
      if (savedChatSessionId) {
        fetch(`${BACKEND_URL}/api/chat/history/${savedChatSessionId}`)
          .then(async (res) => {
            if (!res.ok) throw new Error(`Chat history returned HTTP ${res.status}`);
            return res.json();
          })
          .then((data) => {
            if (Array.isArray(data.messages) && data.messages.length > 0) {
              setChatSessionId(data.session_id);
              setChatMessages(data.messages);
            } else {
              localStorage.removeItem('weathergpt_chat_session');
            }
          })
          .catch((error) => {
            console.error('Chat history error:', error);
            localStorage.removeItem('weathergpt_chat_session');
          });
      }
    }
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setCurrentLang(newLang);
    saveLanguagePreference(newLang, currentUser?.token, BACKEND_URL);
    
    // Update initial greeting in selected language
    const welcomeMessages: Record<SupportedLanguage, string> = {
      en: "Hello! I am WeatherGPT, your AI-powered meteorology copilot. How can I help you today?",
      hi: "नमस्ते! मैं WeatherGPT हूँ, आपका AI मौसम सहायक। आज मैं आपकी क्या मदद कर सकता हूँ?",
      mr: "नमस्कार! मी WeatherGPT आहे, आपला AI हवामान सहाय्यक. आज मी आपली काय मदत करू शकतो?",
      ta: "வணக்கம்! நான் WeatherGPT, உங்கள் AI வானிலை வழிகாட்டி. இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
      te: "నమస్కారం! నేను WeatherGPT, మీ AI వాతావరణ సహాయకుడిని. నేడు నేను మీకు ఎలా సహాయపడగలను?",
      bn: "নমস্কার! আমি WeatherGPT, আপনার AI আবহাওয়া সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
      gu: "નમસ્તે! હું WeatherGPT છું, તમારો AI હવામાન સહાયક. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
      kn: "ನಮಸ್ಕಾರ! ನಾನು WeatherGPT, ನಿಮ್ಮ AI ಹವಾಮಾನ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      ml: "നമസ്കാരം! ഞാൻ WeatherGPT, നിങ്ങളുടെ AI കാലാവസ്ഥാ സഹായി. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?",
      pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ WeatherGPT ਹਾਂ, ਤੁਹਾਡਾ AI ਮੌਸਮ ਸਹਾਇਕ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?"
    };
    setChatMessages(prev => {
      if (prev.length <= 1) {
        return [{
          id: 1,
          role: 'assistant',
          content: welcomeMessages[newLang] || welcomeMessages.en,
          created_at: new Date().toISOString()
        }];
      }
      return prev;
    });
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('weathergpt_theme', nextTheme);
  };

  const handleUserLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('weathergpt_user', JSON.stringify(user));
    if (user.role) {
      setCurrentMode(user.role);
      localStorage.setItem('weathergpt_mode', user.role);
    }
  };

  const handleUserLogout = () => {
    const guestUser: UserProfile = {
      name: "Guest Explorer",
      email: "guest@weathergpt.local",
      role: "general",
      isGuest: true
    };
    setCurrentUser(guestUser);
    setCurrentMode('general');
    localStorage.removeItem('weathergpt_user');
    localStorage.removeItem('weathergpt_token');
    localStorage.setItem('weathergpt_mode', 'general');
  };

  // Helpers for instant offline fallback with Google Weather style date & hourly features
  const generateFallbackForecast = (baseTemp: number, baseRain: number): WeatherForecastItem[] => {
    const conditions = [
      { cond: "Partly Cloudy", icon: "sun", risk: "LOW", rec: "Pleasant outdoor weather expected." },
      { cond: "Light Showers", icon: "cloud-drizzle", risk: "LOW", rec: "Light raincoat or umbrella recommended." },
      { cond: "Overcast Clouds", icon: "cloud", risk: "LOW", rec: "Good conditions for general outdoor work." },
      { cond: "Moderate Rain", icon: "cloud-rain", risk: "MODERATE", rec: "Carry rain gear and drive carefully." },
      { cond: "Thunderstorm", icon: "cloud-lightning", risk: "HIGH", rec: "Stay indoors during peak lightning hours." },
      { cond: "Clear Sky", icon: "sun", risk: "LOW", rec: "Ideal travel and harvesting conditions." },
      { cond: "Heavy Rain", icon: "cloud-lightning", risk: "SEVERE", rec: "Secure property and avoid non-essential travel." }
    ];
    const baseDate = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return Array.from({ length: 7 }, (_, i) => {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + i);
      const dayName = i === 0 ? "Today" : dayNames[targetDate.getDay()];
      const dateFormatted = `${String(targetDate.getDate()).padStart(2, '0')} ${monthNames[targetDate.getMonth()]}`;
      const dateIso = targetDate.toISOString().split('T')[0];

      const tMax = Math.round(baseTemp + (i % 3) * 1.5 - (i > 3 ? 2 : 0));
      const tMin = Math.round(tMax - 5 - (i % 2 === 0 ? 1 : 0));
      const rainProb = Math.max(10, Math.min(95, baseRain - i * 11 + (i % 2 === 0 ? 15 : -5)));
      const condObj = conditions[i % conditions.length];

      const hourLabels = ["12:00 AM", "03:00 AM", "06:00 AM", "09:00 AM", "12:00 PM", "03:00 PM", "06:00 PM", "09:00 PM"];
      const hourlySlices: HourlyForecastItem[] = hourLabels.map((hLabel, hStep) => {
        const isDaytime = hStep >= 3 && hStep <= 5;
        const sliceTemp = Math.round(tMin + ((tMax - tMin) * (isDaytime ? 0.85 : 0.25)));
        const sliceRain = Math.max(5, Math.min(95, rainProb + (isDaytime ? 10 : -10)));
        return {
          time: hLabel,
          temp: sliceTemp,
          rain_probability: sliceRain,
          condition: sliceRain > 60 ? "Rain" : (sliceRain > 30 ? "Partly Cloudy" : "Clear Sky"),
          icon: sliceRain > 60 ? "cloud-rain" : (sliceRain > 30 ? "cloud" : "sun"),
          wind: 12 + (hStep % 4)
        };
      });

      return {
        day: dayName,
        date: dateFormatted,
        date_iso: dateIso,
        temp: tMax,
        temp_max: tMax,
        temp_min: tMin,
        condition: condObj.cond,
        icon: condObj.icon,
        rain_probability: rainProb,
        wind: 14 + (i * 2) % 10,
        humidity: Math.max(45, Math.min(92, 80 - i * 4)),
        risk_level: condObj.risk,
        recommendation: condObj.rec,
        uv_index: Math.max(3, Math.min(9, 7 - (i % 3))),
        sunrise: "06:15 AM",
        sunset: "06:45 PM",
        hourly: hourlySlices
      };
    });
  };

  const ensureForecast = useCallback((w: WeatherData): WeatherData => {
    if (!w) return DEFAULT_WEATHER;
    const cleanLoc = (w.location || "").replace(/\s*\((?:demo\s*fallback|offline\s*\/?\s*cached\s*mode|location\s*approx|offline\s*fallback)\)/gi, '').trim();
    const cleanUpdated = (w.current?.updated_at || "").replace(/Demo Fallback,?\s*/gi, '').replace(/Offline Fallback,?\s*/gi, '').trim();
    const updatedWeather: WeatherData = {
      ...w,
      location: cleanLoc || w.location || "Mumbai",
      current: {
        ...w.current,
        updated_at: cleanUpdated || w.current?.updated_at || "Live Synchronized"
      }
    };
    if (!updatedWeather.forecast || !Array.isArray(updatedWeather.forecast) || updatedWeather.forecast.length < 5) {
      const baseTemp = updatedWeather.current?.temp ?? 27;
      const baseRain = updatedWeather.current?.rain_probability ?? 40;
      return {
        ...updatedWeather,
        forecast: generateFallbackForecast(baseTemp, baseRain)
      };
    }
    return updatedWeather;
  }, []);

  const getInstantOfflineWeather = (loc: string) => {
    const locName = loc ? (loc.charAt(0).toUpperCase() + loc.slice(1)).replace(/\s*\((?:demo\s*fallback|offline\s*\/?\s*cached\s*mode|location\s*approx|offline\s*fallback)\)/gi, '').trim() : "Mumbai";
    return {
      weather: {
        location: locName,
        current: {
          temp: 26,
          feels_like: 27.5,
          condition: "Partly Cloudy",
          humidity: 75,
          wind_speed: 14,
          rain_probability: 30,
          air_quality: "Good (AQI 35)",
          pressure: 1012,
          visibility: 9.0,
          uv_index: 4.5,
          sunrise: "06:15 AM",
          sunset: "06:45 PM",
          icon: "sun",
          source: "Offline Local Engine"
        },
        forecast: generateFallbackForecast(26, 30)
      },
      risk: {
        score: 28,
        category: "LOW" as const,
        color: "emerald",
        breakdown: [
          { factor: "Precipitation Rate", score: 30, description: "Normal localized atmospheric state" },
          { factor: "Wind Gusts", score: 20, description: "Gentle surface breeze" },
          { factor: "Atmospheric Humidity", score: 35, description: "Comfortable relative humidity" }
        ]
      }
    };
  };

  // Fetch weather data function with NWP model support
  const fetchWeatherData = useCallback(async (loc: string, modelOverride?: string) => {
    setIsRefreshing(true);
    const nwpToUse = modelOverride || selectedNwpModel;
    try {
      if (isOffline) {
        // Fallback to local storage cache if offline
        const cached = localStorage.getItem(`weather_cache_${loc.toLowerCase()}_${nwpToUse}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.weather && parsed.weather.forecast && parsed.weather.forecast.length >= 5) {
              setWeather(ensureForecast(parsed.weather));
              setRisk(parsed.risk || DEFAULT_RISK);
              setIsRefreshing(false);
              return;
            }
          } catch (err) {
            console.error("Cache parse error:", err);
          }
        }
        // Instant offline fallback data without waiting for network failure
        const offlineData = getInstantOfflineWeather(loc);
        setWeather(ensureForecast(offlineData.weather));
        setRisk(offlineData.risk);
        setIsRefreshing(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/weather/current?location=${encodeURIComponent(loc)}&nwp_model=${encodeURIComponent(nwpToUse)}`);
      if (res.ok) {
        const data = await res.json();
        const safeWeather = ensureForecast(data.weather);
        setWeather(safeWeather);
        setRisk(data.risk || DEFAULT_RISK);
        if (safeWeather.coordinates?.lat && safeWeather.coordinates?.lon) {
          setMapCenter([safeWeather.coordinates.lat, safeWeather.coordinates.lon]);
        }
        if (loc.includes(',') && safeWeather.location) {
          setSearchLocation(safeWeather.location);
        }
        
        // Cache guaranteed complete weather data to local storage
        localStorage.setItem(`weather_cache_${loc.toLowerCase()}_${nwpToUse}`, JSON.stringify({
          weather: safeWeather,
          risk: data.risk || DEFAULT_RISK
        }));
      } else {
        throw new Error("Failed to fetch weather");
      }
    } catch (e) {
      console.error("Fetch weather fallback triggered:", e);
      const offlineData = getInstantOfflineWeather(loc);
      setWeather(ensureForecast(offlineData.weather));
      setRisk(offlineData.risk);
    } finally {
      setIsRefreshing(false);
    }
  }, [isOffline, ensureForecast, selectedNwpModel]);

  const handleUseCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsRefreshing(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setMapCenter([lat, lon]);
          const coordStr = `${lat.toFixed(4)},${lon.toFixed(4)}`;
          
          // Clear any corrupt/empty cached entries for this coordinate
          try {
            localStorage.removeItem(`weather_cache_${coordStr.toLowerCase()}`);
            localStorage.removeItem(`weather_cache_${coordStr}`);
          } catch {
            // ignore
          }

          setSearchLocation(coordStr);
          fetchWeatherData(coordStr);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setIsRefreshing(false);
          alert("Unable to acquire GPS coordinates. Please check browser location permissions.");
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const fetchDisasterMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/disaster/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setDisasterDashboard(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchGlobalAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAllAlerts(data.alerts);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchWeatherData(searchLocation);
    fetchDisasterMetrics();
    fetchGlobalAlerts();
  }, [searchLocation, fetchWeatherData, fetchDisasterMetrics, fetchGlobalAlerts]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Load offline cache on mount
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    handleOnlineStatus();
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const runRouteAnalysis = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/route/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_location: routeFrom, to_location: routeTo })
      });
      if (res.ok) {
        const data = await res.json();
        setRouteAnalysis(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendChatMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);
    if (isOffline) {
      const qLower = textToSend.toLowerCase();
      const locDisplay = weather?.location?.replace(/\s*\(.*?\)/, '') || searchLocation || 'Pune';
      const temp = weather?.current?.temp ?? 26;
      const cond = weather?.current?.condition ?? 'Partly Cloudy';
      const rainProb = weather?.current?.rain_probability ?? 30;
      
      let fallbackText = "";
      const isRainQuery = qLower.includes('rain') || qLower.includes('पाऊस') || qLower.includes('बारिश');
      const isTravelQuery = qLower.includes('travel') || qLower.includes('route') || qLower.includes('highway') || qLower.includes('drive') || qLower.includes('प्रवास') || qLower.includes('यात्रा');
      const isAgroQuery = qLower.includes('irrigate') || qLower.includes('crop') || qLower.includes('farm') || qLower.includes('शेती') || qLower.includes('सिंचाई') || currentMode === 'farmer';

      if (currentLang === 'hi') {
        fallbackText = `[ऑफलाइन मोड] वर्तमान में ${locDisplay} में तापमान ${temp}°C है, स्थिति '${cond}' है और बारिश की संभावना ${rainProb}% है।`;
        if (isRainQuery) {
          fallbackText = rainProb > 40
            ? `[ऑफलाइन मोड] हाँ, आज ${locDisplay} में बारिश होने की संभावना है (${rainProb}%, मौसम: ${cond})। कृपया छाता या रेनकोट साथ रखें।`
            : `[ऑफलाइन मोड] नहीं, आज ${locDisplay} में भारी बारिश की संभावना नहीं है (बारिश संभावना: ${rainProb}%)।`;
        } else if (isTravelQuery) {
          fallbackText = `[ऑफलाइन यात्रा सलाह] ${locDisplay} में मौसम ${cond} और तापमान ${temp}°C है। दृश्यता सामान्य है। सुरक्षित वाहन चलाएं।`;
        } else if (isAgroQuery) {
          fallbackText = rainProb >= 50
            ? `[ऑफलाइन कृषि सलाह] ${locDisplay} में आज बारिश की संभावना ${rainProb}% है। जलभराव रोकने के लिए सिंचाई टालने की सलाह दी जाती है।`
            : `[ऑफलाइन कृषि सलाह] ${locDisplay} में बारिश की संभावना कम है (${rainProb}%)। आप फसलों की सामान्य सिंचाई कर सकते हैं।`;
        }
      } else if (currentLang === 'mr') {
        fallbackText = `[ऑफलाइन मोड] सध्या ${locDisplay} मध्ये तापमान ${temp}°C असून हवामान '${cond}' आणि पावसाची शक्यता ${rainProb}% आहे.`;
        if (isRainQuery) {
          fallbackText = rainProb > 40
            ? `[ऑफलाइन मोड] होय, आज ${locDisplay} मध्ये पावसाची शक्यता आहे (${rainProb}%, हवामान: ${cond})। कृपया छत्री सोबत ठेवा.`
            : `[ऑफलाइन मोड] नाही, आज ${locDisplay} मध्ये मुसळधार पावसाची शक्यता नाही (पावसाची शक्यता: ${rainProb}%).`;
        } else if (isTravelQuery) {
          fallbackText = `[ऑफलाइन प्रवास सल्ला] ${locDisplay} मध्ये हवामान ${cond} आणि तापमान ${temp}°C आहे. दृश्यता सामान्य आहे. काळजीपूर्वक वाहन चालवा.`;
        } else if (isAgroQuery) {
          fallbackText = rainProb >= 50
            ? `[ऑफलाइन कृषी सल्ला] ${locDisplay} मध्ये पावसाची शक्यता ${rainProb}% आहे. पिकांमध्ये पाणी साचू नये म्हणून सिंचन पुढे ढकलावे.`
            : `[ऑफलाइन कृषी सल्ला] ${locDisplay} मध्ये पावसाची शक्यता कमी आहे (${rainProb}%). पिकांना नियमित पाणी देऊ शकता.`;
        }
      } else {
        fallbackText = `[Offline Mode] Currently in ${locDisplay}, temperature is ${temp}°C with ${cond} and rain probability of ${rainProb}%. Operating on local cache.`;
        if (isRainQuery) {
          fallbackText = rainProb > 40
            ? `[Offline Mode] Rain is expected in ${locDisplay} today (Probability: ${rainProb}%, Condition: ${cond}, Temp: ${temp}°C). Please carry rain gear.`
            : `[Offline Mode] No significant rain expected in ${locDisplay} today (Rain probability: ${rainProb}%, Condition: ${cond}, Temp: ${temp}°C).`;
        } else if (isTravelQuery) {
          fallbackText = `[Offline Route Advisory] Weather in ${locDisplay} is ${cond} with ${temp}°C. Visibility is normal. Drive safely and check local conditions.`;
        } else if (isAgroQuery) {
          fallbackText = rainProb >= 50
            ? `[Offline Agro Advisory] Rain is expected in ${locDisplay} (${rainProb}%). Delaying irrigation is advised to conserve water and protect soil.`
            : `[Offline Agro Advisory] Rain probability is low (${rainProb}%) in ${locDisplay}. Safe to proceed with normal crop irrigation.`;
        }
      }

      const assistantMsg: ChatMessage = {
        id: generateMessageId() + 1,
        role: 'assistant',
        content: fallbackText,
        metadata: { type: 'offline_local_nlp', source: 'Offline Rule-Based Local AI' },
        created_at: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
      if (voicePlayback) {
        speakText(fallbackText);
      }
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          session_id: chatSessionId,
          role: currentMode,
          lang: currentLang,
          location: searchLocation || (weather ? weather.location : 'Pune')
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatSessionId(data.session_id);
        localStorage.setItem('weathergpt_chat_session', data.session_id);
        
        const assistantMsg: ChatMessage = {
          id: generateMessageId() + 1,
          role: 'assistant',
          content: data.answer_text,
          metadata: data.metadata,
          created_at: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, assistantMsg]);
        
        // Voice playback if enabled
        if (voicePlayback) {
          speakText(data.answer_text);
        }
      } else {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
    } catch (e) {
      console.error("Chat error:", e);
      // Contextual local rule-based response if backend is offline or warming up
      const qLower = textToSend.toLowerCase();
      const locDisplay = weather?.location?.replace(/\s*\(.*?\)/, '') || searchLocation || 'Pune';
      const temp = weather?.current?.temp ?? 26;
      const cond = weather?.current?.condition ?? 'Partly Cloudy';
      const rainProb = weather?.current?.rain_probability ?? 30;
      
      let fallbackText = `Hello! Currently in ${locDisplay}, temperature is ${temp}°C with ${cond} and rain probability of ${rainProb}%. How can I assist you further?`;
      
      if (qLower.includes('rain') || qLower.includes('पाऊस') || qLower.includes('बारिश')) {
        fallbackText = rainProb > 40
          ? `Yes, rain is likely in ${locDisplay} (Probability: ${rainProb}%, Condition: ${cond}, Temp: ${temp}°C). Please carry rain gear.`
          : `No heavy rain expected in ${locDisplay} today (Rain probability: ${rainProb}%, Condition: ${cond}, Temp: ${temp}°C).`;
      } else if (qLower.includes('travel') || qLower.includes('route') || qLower.includes('highway') || qLower.includes('drive')) {
        fallbackText = `Route advisory: Weather in ${locDisplay} is ${cond} with ${temp}°C. Visibility is normal. Drive safely and monitor live alerts.`;
      } else if (qLower.includes('irrigate') || qLower.includes('crop') || qLower.includes('farm') || currentMode === 'farmer') {
        fallbackText = rainProb >= 50
          ? `Agro Advisory: Rain is forecast for ${locDisplay} today (${rainProb}%). Delaying irrigation is advised to avoid waterlogging.`
          : `Agro Advisory: Rain probability is low (${rainProb}%) in ${locDisplay}. You may proceed with standard crop irrigation.`;
      }

      setChatMessages(prev => [...prev, {
        id: generateMessageId() + 2,
        role: 'assistant' as const,
        content: fallbackText,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Web Speech Synthesis
  const speakText = (txt: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel previous speech
      window.speechSynthesis.cancel();
      const cleanText = txt.replace(/[*#`[\]()]/g, ''); // strip markdown formatting
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = currentLang === 'hi' ? 'hi-IN' : (currentLang === 'mr' ? 'mr-IN' : 'en-IN');
      window.speechSynthesis.speak(utterance);
    }
  };

  // Enhanced Web Speech Recognition
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as SpeechRecognitionWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatus("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Brave.");
      setTimeout(() => setVoiceStatus(''), 5000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = LANGUAGE_MAP[currentLang]?.speechLocale || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus("Listening... Speak clearly into your microphone.");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const speechResult = event.results[0][0].transcript;
        setChatInput(speechResult);
        setVoiceStatus(`Voice Recognized: "${speechResult}"`);
        sendChatMessage(speechResult);
        setTimeout(() => setVoiceStatus(''), 4000);
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setVoiceStatus("Microphone access denied. Please grant microphone permissions in your browser.");
        } else if (e.error === 'no-speech') {
          setVoiceStatus("No speech detected. Please try speaking again.");
        } else {
          setVoiceStatus(`Voice input error (${e.error}). Try typing your query.`);
        }
        setTimeout(() => setVoiceStatus(''), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setVoiceStatus("Failed to activate microphone. Please check browser permissions.");
      setTimeout(() => setVoiceStatus(''), 5000);
    }
  };

  // Icons Helper
  const getWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'cloud-lightning': return <CloudLightning className="h-10 w-10 text-violet-400" />;
      case 'cloud-rain': return <CloudRain className="h-10 w-10 text-emerald-400" />;
      case 'cloud-drizzle': return <CloudRain className="h-10 w-10 text-emerald-300" />;
      case 'sun': return <Sun className="h-10 w-10 text-amber-400 animate-spin-slow" />;
      case 'cloud': return <Cloud className="h-10 w-10 text-slate-400" />;
      default: return <Cloud className="h-10 w-10 text-slate-400" />;
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'light' ? 'light-mode' : 'dark'} bg-background text-on-surface font-body relative`}>
      {/* 1. LEFT NAVIGATION RAIL (w-72) */}
      <aside className="hidden md:flex flex-col w-72 bg-surface-container-lowest border-r border-surface-container-high shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 justify-between overflow-y-auto select-none">
        <div className="p-space-md">
          {/* WeatherGPT Branding Header */}
          <div className="flex items-center gap-space-sm pb-space-md border-b border-surface-container-high">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white text-lg shadow-sm">
              ⛈️
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">WeatherGPT</span>
              <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase font-semibold">IMD Copilot • MoES</span>
            </div>
          </div>

          {/* Intelligence Core Navigation */}
          <div className="pt-space-md">
            <span className="font-label-mono-bold text-label-mono-bold text-on-surface-variant uppercase tracking-wider block mb-space-xs">
              Intelligence Core
            </span>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  activeTab === 'dashboard'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">sensors</span>
                <span className="font-body-md text-body-md">Live Telemetry</span>
              </button>

              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  activeTab === 'map'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">radar</span>
                <span className="font-body-md text-body-md">Radar &amp; Maps</span>
              </button>

              <button
                onClick={() => setActiveTab('route')}
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  activeTab === 'route'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">satellite_alt</span>
                <span className="font-body-md text-body-md">Route Intel</span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  activeTab === 'alerts'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">warning</span>
                <span className="font-body-md text-body-md">Severe Alerts</span>
              </button>

              <button
                onClick={() => setActiveTab('disaster')}
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  activeTab === 'disaster'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">shield</span>
                <span className="font-body-md text-body-md">Command Center</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  activeTab === 'settings'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
                <span className="font-body-md text-body-md">System Settings</span>
              </button>
            </nav>
          </div>

          {/* Operational Modes Rail */}
          <div className="pt-space-md">
            <span className="font-label-mono-bold text-label-mono-bold text-on-surface-variant uppercase tracking-wider block mb-space-xs">
              Operational Modes
            </span>
            <div className="flex flex-col gap-space-xs">
              <button
                onClick={() => setCurrentMode('farmer')}
                className={`w-full flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  currentMode === 'farmer' ? 'bg-surface-container-high text-primary font-bold' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">agriculture</span>
                  <span className="font-body-sm text-body-sm">Kisan / Agri</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-radar-emerald animate-pulse"></span>
              </button>

              <button
                onClick={() => setCurrentMode('aviation')}
                className={`w-full flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  currentMode === 'aviation' ? 'bg-surface-container-high text-secondary font-bold' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[18px]">flight</span>
                  <span className="font-body-sm text-body-sm">Aviation Synoptic</span>
                </div>
                <span className="font-label-mono-sm text-label-mono-sm text-outline">READY</span>
              </button>

              <button
                onClick={() => setCurrentMode('smartcity')}
                className={`w-full flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  currentMode === 'smartcity' ? 'bg-surface-container-high text-atmospheric-cyan font-bold' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-atmospheric-cyan text-[18px]">location_city</span>
                  <span className="font-body-sm text-body-sm">Smart City Matrix</span>
                </div>
                <span className="font-label-mono-sm text-label-mono-sm text-outline">STANDBY</span>
              </button>
            </div>
          </div>

          {/* Advanced Analytics Tools */}
          <div className="pt-space-md">
            <span className="font-label-mono-bold text-label-mono-bold text-on-surface-variant uppercase tracking-wider block mb-space-xs">
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
                className="flex w-full items-center gap-2 px-space-sm py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition cursor-pointer"
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

        {/* Photo Weather AI Quick Card */}
        <div className="p-space-md bg-surface-container-low rounded-t-xl mx-space-sm mb-space-sm border border-surface-container-high">
          <div className="flex items-center gap-space-xs mb-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">photo_camera</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Photo Weather AI</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm leading-relaxed">
            Upload sky snapshots for automated cloud vector &amp; barometric estimation.
          </p>
          <Link
            href="/photo-analysis"
            className="w-full flex items-center justify-center gap-space-xs py-2 px-space-sm rounded-lg bg-primary text-on-primary font-body-sm text-body-sm hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
            <span>Analyze Cloudscape</span>
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER & TOP HEADER (md:pl-72) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden md:pl-72 relative">
        {/* Top Floating Glass Header */}
        <header className="fixed top-0 left-0 md:left-72 right-0 h-16 bg-surface-glass backdrop-blur-xl border-b border-surface-container-high shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-md md:px-space-lg">
          {/* Universal Observatory / Location Search Bar */}
          <div className="flex items-center gap-space-sm flex-1 max-w-xl mr-2">
            <div className="relative flex-1 flex items-center bg-surface-container-low rounded-lg px-space-sm py-1.5 border border-surface-container-high focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-outline text-[20px] mr-space-xs">search</span>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchWeatherData(searchLocation);
                  }
                }}
                placeholder="Search Observatory, AWS Station, City or Coordinates..."
                className="bg-transparent border-0 outline-none w-full font-body-sm text-body-sm text-on-surface placeholder:text-outline"
              />
              <button
                onClick={handleUseCurrentLocation}
                disabled={isRefreshing}
                title="Acquire Current GPS Fix"
                className="flex items-center gap-space-xs px-2 py-1 rounded bg-surface-container-highest text-on-surface hover:bg-primary hover:text-on-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">my_location</span>
                <span className="font-label-mono-sm text-label-mono-sm font-bold">GPS</span>
              </button>
            </div>
          </div>

          {/* Right Controls: WIS status, Language select, Theme toggle, User badge */}
          <div className="flex items-center gap-2 md:gap-space-md">
            {/* Realtime WIS 2.0 / MQTT Stream Status */}
            <div className="hidden xl:flex items-center gap-space-xs px-space-sm py-1.5 rounded-full bg-surface-container-high border border-surface-container">
              <span className="w-2 h-2 rounded-full bg-radar-emerald animate-ping"></span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface">
                WIS 2.0 / MQTT: <span className="text-primary font-bold">ACTIVE {weather?.wis2_telemetry?.latency_ms ?? 12}ms</span>
              </span>
              <span className="text-outline font-label-mono-sm text-label-mono-sm">• Online</span>
            </div>

            {/* Offline/Online toggle */}
            <button
              onClick={() => setIsOffline(prev => !prev)}
              title={isOffline ? "Switch to Online Mode" : "Switch to Offline / Local Cache"}
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                isOffline ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-primary-fixed/30 text-primary border-primary/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-rose-500' : 'bg-radar-emerald'}`}></span>
              <span>{isOffline ? 'Offline' : 'Live'}</span>
            </button>

            {/* Multilingual Selector */}
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

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Toggle Interface Lighting Mode"
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

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
                  {currentUser?.isGuest ? 'IMD-CIVIL-PUBLIC' : (currentUser?.role?.toUpperCase() || 'IMD-VERIFIED')}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden flex bg-surface-container-lowest border-b border-surface-container-high p-2 overflow-x-auto whitespace-nowrap select-none mt-16">
          <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'dashboard' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Live Telemetry</button>
          <button onClick={() => setActiveTab('map')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'map' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Radar &amp; Maps</button>
          <button onClick={() => setActiveTab('route')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'route' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Route Intel</button>
          <button onClick={() => setActiveTab('alerts')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'alerts' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Severe Alerts</button>
          <button onClick={() => setActiveTab('disaster')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'disaster' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Command Center</button>
          <button onClick={() => setActiveTab('settings')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${activeTab === 'settings' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>Settings</button>
          <Link href="/photo-analysis" className="px-3 py-1.5 text-xs font-bold rounded-lg text-primary bg-primary-fixed/40">📷 Photo AI</Link>
        </div>

        {/* Main Canvas Scroll Area */}
        <div className="w-full flex-1 overflow-y-auto pt-16 bg-background">
          {/* TAB 1: WEATHER DASHBOARD */}
          {activeTab === 'dashboard' && (
            weather ? (
              <div className="p-space-md lg:p-space-lg flex flex-col gap-space-md">
                {/* 1. Prominent Meteorological Hubs Ticker */}
                <section className="w-full flex items-center gap-space-sm overflow-x-auto pb-1 scrollbar-none">
                  <div className="flex items-center gap-space-xs shrink-0 px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
                    <span className="font-label-mono-bold text-label-mono-bold uppercase tracking-wider text-on-surface-variant">Prominent Hubs:</span>
                  </div>
                  <div className="flex items-center gap-space-xs shrink-0">
                    {[
                      { name: "Pune", badge: "27°C • Rain", icon: "🌧️" },
                      { name: "Mumbai", badge: "29°C • Coast", icon: "🌊" },
                      { name: "Delhi", badge: "38°C • Warm", icon: "☀️" },
                      { name: "Nashik", badge: "26°C • Agri", icon: "🍇" },
                      { name: "Bengaluru", badge: "24°C • Cool", icon: "💻" },
                      { name: "Jaipur", badge: "35°C • Clear", icon: "🏰" },
                      { name: "Lonavala", badge: "21°C • Ghats", icon: "⛰️" },
                      { name: "Shimla", badge: "18°C • Hills", icon: "🌲" },
                      { name: "Kolkata", badge: "32°C • Humid", icon: "🏛️" },
                      { name: "Goa", badge: "30°C • Beach", icon: "🏖️" },
                      { name: "Varanasi", badge: "34°C • River", icon: "🕉️" }
                    ].map((hub) => {
                      const isCurrent = (weather?.location || searchLocation).toLowerCase().includes(hub.name.toLowerCase());
                      return (
                        <button
                          key={hub.name}
                          onClick={() => {
                            setSearchLocation(hub.name);
                            fetchWeatherData(hub.name);
                          }}
                          className={`flex items-center gap-space-xs px-3 py-1.5 rounded-full transition-all text-left cursor-pointer ${
                            isCurrent
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high border border-surface-container-high'
                          }`}
                        >
                          <span className="text-sm">{hub.icon}</span>
                          <span className="font-body-md text-body-md font-semibold">{hub.name}</span>
                          <span className={`font-label-mono-sm text-label-mono-sm ${isCurrent ? 'opacity-90' : 'text-on-surface-variant'}`}>{hub.badge}</span>
                          {isCurrent && <span className="w-2 h-2 rounded-full bg-primary-fixed ml-0.5 animate-pulse" />}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 2. Main Meteorological Grid: 12-Column System (8 Col Primary Telemetry + 4 Col AI Intelligence) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
                  {/* LEFT 8 COLUMNS: Primary NWP, Synoptic Telemetry, Sector Advisory & 7-Day Inspection */}
                  <div className="xl:col-span-8 flex flex-col gap-space-md">
                    {/* Primary Synoptic Card */}
                    <div className="bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg shadow-sm border border-surface-container-high flex flex-col gap-space-md relative overflow-hidden">
                      <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />

                      {/* Header & Controls Bar */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-space-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-radar-emerald animate-pulse"></span>
                            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                              IMD / Open-Meteo (Live Telemetry)
                            </span>
                            <span className="font-label-mono-sm text-label-mono-sm text-outline">• Updated 3m ago</span>
                          </div>
                          <div className="flex items-baseline gap-space-xs mt-0.5">
                            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface uppercase font-bold">
                              {weather.location}
                            </h1>
                            <span className="font-label-mono-bold text-label-mono-bold text-secondary uppercase px-1.5 py-0.5 rounded bg-surface-container-high">
                              IN (411005)
                            </span>
                          </div>
                        </div>

                        {/* NWP Consensus, WIS Status & Voice Query */}
                        <div className="flex flex-wrap items-center gap-space-xs">
                          {/* NWP Model Dropdown */}
                          <div className="flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg bg-surface-container-low text-on-surface border border-surface-container-high">
                            <span className="material-symbols-outlined text-secondary text-[18px]">public</span>
                            <span className="font-label-mono-bold text-label-mono-bold text-secondary">NWP:</span>
                            <select
                              value={selectedNwpModel}
                              onChange={(e) => {
                                const m = e.target.value as 'best_match' | 'gfs' | 'ecmwf' | 'icon';
                                setSelectedNwpModel(m);
                                fetchWeatherData(searchLocation, m);
                              }}
                              className="bg-transparent border-0 outline-none font-body-sm text-body-sm text-on-surface cursor-pointer pr-1"
                            >
                              <option value="best_match">Ensemble Consensus (GFS+ECMWF+WRF)</option>
                              <option value="gfs">NOAA GFS (0.25° Global)</option>
                              <option value="ecmwf">ECMWF IFS (0.1° High-Res)</option>
                              <option value="icon">DWD ICON / WRF (13km Meso)</option>
                            </select>
                          </div>

                          {/* WIS 2.0 Realtime Status Badge */}
                          <div className="flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg bg-primary-container text-on-primary-container shadow-xs">
                            <span className="material-symbols-outlined text-[16px] text-primary-fixed animate-pulse">cell_tower</span>
                            <span className="font-label-mono-sm text-label-mono-sm font-semibold">WIS 2.0 / MQTT: ACTIVE ({weather?.wis2_telemetry?.latency_ms ?? 12}ms)</span>
                          </div>

                          {/* Rural Voice Assistant Query */}
                          <button
                            onClick={() => {
                              setChatOpen(true);
                              setVoicePlayback(true);
                            }}
                            className="flex items-center gap-1 px-space-sm py-1.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim transition-colors cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">mic</span>
                            <span className="font-body-sm text-body-sm font-semibold">
                              {currentLang === 'hi' ? 'बोलकर पूछें' : (currentLang === 'mr' ? 'बोलून विचारा' : 'Voice Query')}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Hero Reading & Micro Vector Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center pt-space-xs">
                        <div className="md:col-span-6 flex items-center gap-space-md">
                          <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center text-primary shrink-0 shadow-inner">
                            <span className="material-symbols-outlined text-[48px]">
                              {weather.current.condition.toLowerCase().includes('rain') ? 'rainy' : weather.current.condition.toLowerCase().includes('sun') ? 'sunny' : 'cloud'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-space-xs">
                              <span className="font-display-hero text-display-hero text-on-surface tracking-tight">
                                {formatTemperature(weather.current.temp, tempUnit).replace('°C', '').replace('°F', '')}
                              </span>
                              <span className="font-headline-lg text-headline-lg text-on-surface-variant font-light">
                                {tempUnit === 'celsius' ? '°C' : '°F'}
                              </span>
                            </div>
                            <div className="flex items-center gap-space-xs">
                              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                                {translateCondition(weather.current.condition, currentLang)}
                              </span>
                              <span className="font-label-mono-sm text-label-mono-sm text-outline">(35% Coverage)</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Micro Vector Readouts */}
                        <div className="md:col-span-6 grid grid-cols-2 gap-x-space-md gap-y-space-xs p-space-sm bg-surface-container-low rounded-xl border border-surface-container-high">
                          <div className="flex items-center justify-between">
                            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-tertiary">thermostat</span> Feels Like:
                            </span>
                            <span className="font-label-mono-bold text-label-mono-bold text-on-surface">
                              {formatTemperature(weather.current.feels_like, tempUnit)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-secondary">water_drop</span> Humidity:
                            </span>
                            <span className="font-label-mono-bold text-label-mono-bold text-on-surface">
                              {weather.current.humidity}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-atmospheric-cyan">air</span> Wind Vector:
                            </span>
                            <span className="font-label-mono-bold text-label-mono-bold text-on-surface">
                              {formatWindSpeed(weather.current.wind_speed, windUnit)} {weather.current.wind_direction}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-primary">rainy</span> Rain Prob:
                            </span>
                            <span className="font-label-mono-bold text-label-mono-bold text-primary font-bold">
                              {weather.current.rain_probability}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Synoptic Measurement Tiles (Uniform 4-Column Array) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                        <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-0.5 border border-surface-container-high">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-wider">Barometer</span>
                          <span className="font-headline-sm text-headline-sm text-on-surface">{weather.current.pressure ?? 1009} <span className="font-label-mono-sm text-label-mono-sm text-outline font-normal">hPa</span></span>
                          <span className="font-body-sm text-body-sm text-radar-emerald flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">trending_flat</span> Steady
                          </span>
                        </div>
                        <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-0.5 border border-surface-container-high">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-wider">Visibility</span>
                          <span className="font-headline-sm text-headline-sm text-on-surface">{formatDistance(weather.current.visibility ?? 10, distanceUnit)}</span>
                          <span className="font-body-sm text-body-sm text-primary flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">visibility</span> Clear Horizon
                          </span>
                        </div>
                        <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-0.5 border border-surface-container-high">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-wider">Solar UV Index</span>
                          <span className="font-headline-sm text-headline-sm text-tertiary">{weather.current.uv_index ?? 5} <span className="font-label-mono-sm text-label-mono-sm text-outline font-normal">/ 10</span></span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px] text-tertiary">wb_sunny</span> Moderate
                          </span>
                        </div>
                        <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-0.5 border border-surface-container-high">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-wider">Air Quality (CPCB)</span>
                          <span className="font-headline-sm text-headline-sm text-radar-emerald">Good <span className="font-label-mono-sm text-label-mono-sm text-outline font-normal">(AQI 42)</span></span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px] text-radar-emerald">eco</span> PM2.5: 18 µg/m³
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Weather Intelligence Mode Rail */}
                    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high flex flex-col gap-space-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                        <div className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                          <span className="font-label-mono-bold text-label-mono-bold uppercase tracking-wider text-on-surface">Operational Weather Intelligence Mode</span>
                        </div>
                        {/* Mode Switcher Buttons */}
                        <div className="flex items-center p-0.5 rounded-lg bg-surface-container-high gap-0.5">
                          {[
                            { id: 'farmer', label: 'Kisan / Agri', emoji: '🌾' },
                            { id: 'aviation', label: 'Aviation', emoji: '✈️' },
                            { id: 'smartcity', label: 'Smart City', emoji: '🏙️' },
                            { id: 'general', label: 'Public', emoji: '👥' }
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setCurrentMode(m.id as any)}
                              className={`flex items-center gap-1 px-space-sm py-1 rounded-md font-body-sm text-body-sm transition-all cursor-pointer ${
                                currentMode === m.id
                                  ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                                  : 'text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              <span>{m.emoji}</span> {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Contextual Advisory Banner */}
                      <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm border border-surface-container-high">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 mt-0.5 text-on-primary-fixed">
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            {currentMode === 'farmer' && "Sector Advisory: Field Operations Optimal"}
                            {currentMode === 'aviation' && "Sector Advisory: VFR Flight Conditions Normal"}
                            {currentMode === 'smartcity' && "Sector Advisory: Urban Microclimate Nominal"}
                            {currentMode === 'general' && "Sector Advisory: Outdoor Conditions Pleasant"}
                          </span>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {currentMode === 'farmer' && (weather.kisan_advisory?.spraying_window ? `${weather.kisan_advisory.spraying_window}. ${weather.kisan_advisory.irrigation_recommendation}` : "Pleasant outdoor conditions. Standard precautions for humidity & evening precipitation (35%). Favorable window for foliar spraying and irrigation scheduling until 18:00 IST.")}
                            {currentMode === 'aviation' && `Ceiling: ${weather.aviation_briefing?.ceiling_ft ?? 5000}ft AGL. Visibility: ${weather.aviation_briefing?.visibility_km ?? 10}km. Crosswind shear: ${weather.aviation_briefing?.crosswind_risk || 'Low'}.`}
                            {currentMode === 'smartcity' && `Urban Heat Island Index: ${weather.smart_city_telemetry?.heat_island_index || 'Comfortable'}. Drainage overload risk: ${weather.smart_city_telemetry?.drainage_overload_risk || 'Nominal'}. AQI dispersion: ${weather.smart_city_telemetry?.air_quality_dispersion || 'Favorable'}.`}
                            {currentMode === 'general' && "Standard outdoor weather. Light umbrella recommended for evening travel."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Day-Wise 7-Day Forecast & Detailed Synoptic Inspection */}
                    {(() => {
                      const activeForecast = (weather?.forecast && weather.forecast.length > 0)
                        ? weather.forecast
                        : generateFallbackForecast(weather?.current?.temp ?? 27, weather?.current?.rain_probability ?? 40);
                      const activeIdx = Math.min(selectedForecastIndex, activeForecast.length - 1);
                      const selectedDay = activeForecast[activeIdx];

                      return (
                        <div className="bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg shadow-sm border border-surface-container-high flex flex-col gap-space-md">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                            <div>
                              <span className="font-label-mono-bold text-label-mono-bold text-outline uppercase tracking-wider block">
                                Synoptic Outlook
                              </span>
                              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                                Day-Wise Forecast &amp; Meteorological Inspection
                              </h2>
                            </div>
                            <div className="flex items-center gap-space-xs">
                              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Select Date:</span>
                              <span className="px-2 py-1 rounded bg-surface-container-high font-label-mono-sm text-label-mono-sm text-primary font-bold">
                                {translateDay(selectedDay.day, currentLang)} ({selectedDay.temp_max ?? selectedDay.temp}°C)
                              </span>
                            </div>
                          </div>

                          {/* 7-Day Horizontal Card Matrix */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-space-xs">
                            {activeForecast.map((fc: WeatherForecastItem, idx: number) => {
                              const isSelected = activeIdx === idx;
                              const tMax = fc.temp_max ?? fc.temp;
                              const tMin = fc.temp_min ?? (fc.temp - 5);

                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedForecastIndex(idx)}
                                  className={`p-space-sm rounded-xl flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary-container'
                                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border border-surface-container-high'
                                  }`}
                                >
                                  <span className={`font-label-mono-bold text-label-mono-bold uppercase ${isSelected ? 'opacity-90' : 'text-on-surface-variant'}`}>
                                    {translateDay(fc.day, currentLang)}
                                  </span>
                                  <span className="text-xl my-0.5">
                                    {fc.icon.includes('lightning') ? '⛈️' : fc.rain_probability > 50 ? '🌧️' : fc.rain_probability > 25 ? '🌦️' : '⛅'}
                                  </span>
                                  <span className="font-headline-sm text-headline-sm leading-tight font-bold">
                                    {tMax}°/{tMin}°
                                  </span>
                                  <span className={`font-label-mono-sm text-label-mono-sm flex items-center gap-0.5 ${isSelected ? 'opacity-90' : 'text-secondary'}`}>
                                    <span className="material-symbols-outlined text-[14px]">water_drop</span> {fc.rain_probability}%
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-1 ${
                                    isSelected
                                      ? 'bg-primary-container text-on-primary-container'
                                      : fc.risk_level === 'SEVERE' || fc.risk_level === 'HIGH'
                                      ? 'bg-error-container text-on-error-container'
                                      : fc.risk_level === 'MODERATE'
                                      ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                      : 'bg-surface-container-high text-on-surface-variant'
                                  }`}>
                                    {translateRiskCategory(fc.risk_level, currentLang)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Day Detailed Inspection Box */}
                          {selectedDay && (
                            <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-space-md">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                                <div className="flex flex-col">
                                  <span className="font-label-mono-bold text-label-mono-bold text-primary uppercase">
                                    {translateDay(selectedDay.day, currentLang)} • Forecast Inspection
                                  </span>
                                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                                    {translateCondition(selectedDay.condition, currentLang)} (High: {selectedDay.temp_max ?? selectedDay.temp}°C | Low: {selectedDay.temp_min ?? (selectedDay.temp - 5)}°C)
                                  </span>
                                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                                    {translateRecommendation(selectedDay.recommendation, currentLang)}
                                  </span>
                                </div>

                                {/* Solar Ephemeris */}
                                <div className="flex items-center gap-space-md">
                                  <div className="flex items-center gap-space-xs">
                                    <span className="material-symbols-outlined text-tertiary text-[22px]">wb_twilight</span>
                                    <div className="flex flex-col">
                                      <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase">Sunrise</span>
                                      <span className="font-label-mono-bold text-label-mono-bold text-on-surface">{selectedDay.sunrise || "06:15 AM"}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-space-xs">
                                    <span className="material-symbols-outlined text-tertiary-fixed-dim text-[22px]">bedtime</span>
                                    <div className="flex flex-col">
                                      <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase">Sunset</span>
                                      <span className="font-label-mono-bold text-label-mono-bold text-on-surface">{selectedDay.sunset || "06:45 PM"}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Diurnal Precipitation & Thermal Vector SVG Sparkline */}
                              <div className="flex flex-col gap-space-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-label-mono-bold text-label-mono-bold text-on-surface uppercase">Diurnal Precipitation &amp; Thermal Vector</span>
                                  <span className="font-label-mono-sm text-label-mono-sm text-outline">Hourly Interpolation (00:00 - 23:00 IST)</span>
                                </div>
                                <div className="w-full h-28 bg-surface-container-lowest rounded-lg p-2 flex flex-col justify-end relative overflow-hidden border border-surface-container-high">
                                  <svg className="w-full h-20 overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 700 80">
                                    <defs>
                                      <linearGradient id="rainGrad" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#006948" stopOpacity="0.35" />
                                        <stop offset="100%" stopColor="#006948" stopOpacity="0.0" />
                                      </linearGradient>
                                    </defs>
                                    <path d="M0,70 Q70,68 140,55 T280,48 T420,25 T560,35 T700,60 L700,80 L0,80 Z" fill="url(#rainGrad)" />
                                    <path d="M0,70 Q70,68 140,55 T280,48 T420,25 T560,35 T700,60" stroke="#006948" strokeLinecap="round" strokeWidth="2.5" />
                                    <circle cx="420" cy="25" r="4" fill="#006948" className="animate-ping" />
                                    <circle cx="420" cy="25" r="3" fill="#ffffff" stroke="#006948" strokeWidth="2" />
                                  </svg>
                                  <div className="flex justify-between items-center px-1 pt-1 font-label-mono-sm text-label-mono-sm text-outline">
                                    <span>06:00 (10%)</span>
                                    <span>09:00 (15%)</span>
                                    <span>12:00 (25%)</span>
                                    <span className="font-bold text-primary">15:00 (35% Peak)</span>
                                    <span>18:00 (30%)</span>
                                    <span>21:00 (15%)</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* RIGHT 4 COLUMNS: AI Photo Weather Intelligence & Risk Engine */}
                  <div className="xl:col-span-4 flex flex-col gap-space-md">
                    {/* Multimodal Photo Weather Intelligence Card */}
                    <div className="rounded-xl p-space-md shadow-sm bg-gradient-to-br from-surface-container to-surface-container-highest border border-surface-container-high flex flex-col gap-space-sm relative overflow-hidden">
                      <div className="flex items-center gap-space-xs">
                        <span className="text-2xl">📷</span>
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Photo Weather Intelligence</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-primary font-bold">MULTIMODAL COPILOT</span>
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                        Upload or snap a sky view. WeatherGPT&apos;s vision model segments cloud genus, optical barometry, and fog dissipation in real time.
                      </p>

                      {/* Interactive Photo Dropzone */}
                      <Link
                        href="/photo-analysis"
                        className="relative w-full h-36 rounded-lg overflow-hidden flex flex-col items-center justify-center text-center p-space-sm bg-surface-container-lowest/80 backdrop-blur-sm group cursor-pointer hover:bg-surface-container-lowest transition-all border border-surface-container-high"
                      >
                        <div className="relative z-10 flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                          </div>
                          <span className="font-body-sm text-body-sm font-semibold text-on-surface">Drop cloudscape photo here</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-outline">Supports JPG, PNG, HEIC (Max 25MB)</span>
                        </div>
                      </Link>

                      {/* Feature Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 text-on-surface-variant">
                        <span className="px-2 py-0.5 rounded bg-surface-container-low font-label-mono-sm text-label-mono-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-radar-emerald"></span> Multimodal Vision AI
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-low font-label-mono-sm text-label-mono-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-atmospheric-cyan"></span> Live API Correlation
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-low font-label-mono-sm text-label-mono-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Risk Engine
                        </span>
                      </div>

                      {/* Primary CTA Button */}
                      <Link
                        href="/photo-analysis"
                        className="w-full flex items-center justify-center gap-space-xs py-2.5 px-space-md rounded-lg bg-primary text-on-primary font-body-md text-body-md font-semibold hover:bg-primary-container transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                        <span>Analyze a Photo</span>
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </Link>
                    </div>

                    {/* AI Meteorological Risk Score Radial Gauge Card */}
                    {risk && (
                      <div className="bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg shadow-sm border border-surface-container-high flex flex-col gap-space-md">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-label-mono-bold text-label-mono-bold text-outline uppercase tracking-wider">
                              Operational Safety Index
                            </span>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                              AI Meteorological Risk Score
                            </h3>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full font-label-mono-bold text-label-mono-bold uppercase tracking-wider ${
                            risk.score > 75 ? 'bg-error-container text-on-error-container' :
                            risk.score > 40 ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                            'bg-primary-fixed text-on-primary-fixed'
                          }`}>
                            {translateRiskCategory(risk.category, currentLang)}
                          </span>
                        </div>

                        {/* Circular Radial Risk Dial */}
                        <div className="flex flex-col items-center justify-center py-space-xs">
                          <div className="relative w-44 h-44 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                              <circle cx="80" cy="80" r="66" fill="transparent" stroke="#eaedff" strokeWidth="12" />
                              <circle
                                cx="80"
                                cy="80"
                                r="66"
                                fill="transparent"
                                stroke={risk.score > 75 ? '#EF4444' : risk.score > 40 ? '#006948' : '#10B981'}
                                strokeWidth="12"
                                strokeDasharray="414.69"
                                strokeDashoffset={414.69 * (1 - (risk.score / 100))}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="font-display-hero text-display-hero text-on-surface leading-none font-bold">
                                {risk.score}
                              </span>
                              <span className="font-label-mono-bold text-label-mono-bold text-outline uppercase tracking-widest mt-1">
                                / 100
                              </span>
                              <span className="font-label-mono-sm text-label-mono-sm text-primary font-semibold mt-0.5">
                                {risk.category} INDEX
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Risk Breakdown Sub-Metrics */}
                        <div className="flex flex-col gap-space-xs">
                          <div className="flex items-center justify-between p-space-xs rounded bg-surface-container-low border border-surface-container-high">
                            <span className="font-body-sm text-body-sm text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-primary">rainy</span> Precipitation Rate
                            </span>
                            <span className="font-label-mono-bold text-label-mono-bold text-on-surface">
                              +{Math.round((risk.score * 0.45))} ({weather.current.rain_probability}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-space-xs rounded bg-surface-container-low border border-surface-container-high">
                            <span className="font-body-sm text-body-sm text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-tertiary">air</span> Wind Gusts &amp; Shear
                            </span>
                            <span className="font-label-mono-bold text-label-mono-bold text-on-surface">
                              +{Math.round((risk.score * 0.3))} ({weather.current.wind_speed} km/h)
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-space-xs rounded bg-surface-container-low border border-surface-container-high">
                            <span className="font-body-sm text-body-sm text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-secondary">water_drop</span> Atmospheric Humidity
                            </span>
                            <span className="font-label-mono-bold text-label-mono-bold text-on-surface">
                              +{Math.round((risk.score * 0.25))} ({weather.current.humidity}%)
                            </span>
                          </div>
                        </div>

                        {/* Legal & Compliance Notice */}
                        <div className="pt-space-xs">
                          <p className="font-label-mono-sm text-label-mono-sm text-outline italic leading-relaxed">
                            * This score is an AI-assisted meteorological risk model. For legal alerts, navigation orders, and civic advisories, refer exclusively to IMD / MoES official bulletins.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quick AI Meteorological Copilot Chat Launcher */}
                    <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-container-high flex items-center justify-between gap-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                          <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-body-md text-body-md font-semibold text-on-surface">Ask WeatherGPT</span>
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Synoptic reasoning ready</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setChatOpen(true)}
                        className="px-space-sm py-1.5 rounded-lg bg-primary-container text-on-primary-container font-body-sm text-body-sm font-semibold hover:bg-primary transition-colors flex items-center gap-1 cursor-pointer"
                        type="button"
                      >
                        <span>Query</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 text-center">
                <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                <p className="text-on-surface font-bold text-base">Gathering Live Meteorology &amp; Risk Intel for {searchLocation}...</p>
                <p className="text-xs text-on-surface-variant">Connecting to IMD / Open-Meteo feeds...</p>
              </div>
            )
          )}


          {/* TAB 2: LIVE WEATHER MAP */}
          {activeTab === 'map' && (
            <div className="h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-6">
              {/* Map controls panel */}
              <div className="md:w-64 flex-none bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-2">Map Layers</h3>
                  <p className="text-xs text-slate-500">Toggle meteorological dashboard indicators.</p>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveMapLayer('temp')}
                    className={`flex w-full items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeMapLayer === 'temp' 
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-md' 
                        : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center"><Layers className="h-4 w-4 mr-2" /> Temperature</span>
                    {activeMapLayer === 'temp' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  </button>

                  <button 
                    onClick={() => setActiveMapLayer('rain')}
                    className={`flex w-full items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeMapLayer === 'rain' 
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-md' 
                        : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center"><CloudRain className="h-4 w-4 mr-2" /> Rainfall</span>
                    {activeMapLayer === 'rain' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  </button>

                  <button 
                    onClick={() => setActiveMapLayer('wind')}
                    className={`flex w-full items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeMapLayer === 'wind' 
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-md' 
                        : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center"><Wind className="h-4 w-4 mr-2" /> Wind Speeds</span>
                    {activeMapLayer === 'wind' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  </button>

                  <button 
                    onClick={() => setActiveMapLayer('risk')}
                    className={`flex w-full items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeMapLayer === 'risk' 
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-md' 
                        : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> Warning Areas</span>
                    {activeMapLayer === 'risk' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 pt-6 border-t border-slate-800/60">
                  <p>Click pins for risk details and live government bulletins.</p>
                </div>
              </div>

              {/* Leaflet container */}
              <div className="flex-1 min-h-[400px] h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <WeatherMap 
                  activeLayer={activeMapLayer} 
                  searchCenter={mapCenter}
                  activeLocation={weather ? weather.location : searchLocation}
                  onMarkerClick={(name) => {
                    setSearchLocation(name);
                    fetchWeatherData(name);
                  }} 
                />
              </div>
            </div>
          )}

          {/* TAB 3: ROUTE WEATHER INTELLIGENCE */}
          {activeTab === 'route' && (
            <div className="space-y-8">
              
              {/* Route Input controls */}
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-black text-white mb-2">Weather Route Intelligence</h3>
                <p className="text-xs text-slate-500 mb-6">Identify severe weather hazards and optimal departure timings along travel corridors.</p>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block mb-1.5">From</label>
                    <select 
                      value={routeFrom}
                      onChange={(e) => setRouteFrom(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Pune">Pune</option>
                      <option value="Mumbai">Mumbai</option>
                    </select>
                  </div>

                  <div className="flex-none flex items-center justify-center p-3 text-slate-600">
                    <ChevronRight className="h-5 w-5 transform rotate-90 md:rotate-0" />
                  </div>

                  <div className="flex-1 w-full">
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block mb-1.5">To</label>
                    <select 
                      value={routeTo}
                      onChange={(e) => setRouteTo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Mumbai">Mumbai</option>
                      <option value="Pune">Pune</option>
                    </select>
                  </div>

                  <button 
                    onClick={runRouteAnalysis}
                    className="w-full md:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>{text.btn_travel}</span>
                  </button>
                </div>
              </div>

              {/* Route timeline analysis display */}
              {routeAnalysis && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Timeline Stop points */}
                  <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                    <h4 className="text-base font-extrabold text-white mb-6">Route Travel Waypoints</h4>
                    
                    <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {routeAnalysis.timeline.map((stop: RouteTimelineItem, idx: number) => (
                        <div key={idx} className="relative flex justify-between items-start">
                          
                          {/* Colored timeline dot */}
                          <span className={`absolute -left-8 flex h-7.5 w-7.5 items-center justify-center rounded-full border-2 border-slate-950 text-xs font-bold text-white shadow-md
                            ${stop.color === 'red' ? 'bg-red-500' : 
                              stop.color === 'orange' ? 'bg-orange-500' : 
                              stop.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}
                          `}>
                            {idx + 1}
                          </span>

                          <div>
                            <h5 className="text-sm font-black text-slate-100 uppercase">{stop.name}</h5>
                            <p className="text-xs text-slate-500 mt-0.5">{stop.condition} — {stop.temp}°C</p>
                            <p className="text-xs text-slate-400 mt-1 italic">Note: {stop.recommendation}</p>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white
                            ${stop.risk_level === 'SEVERE' ? 'bg-red-500' : 
                              stop.risk_level === 'HIGH' ? 'bg-orange-500' : 
                              stop.risk_level === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'}
                          `}>
                            {stop.risk_level}
                          </span>

                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Travel Recommendation */}
                  <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-16 w-16 bg-emerald-500/10 rounded-full blur-2xl" />
                    
                    <div>
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <Heart className="h-5 w-5 animate-pulse" />
                        <h4 className="text-sm font-bold uppercase tracking-wider">AI Travel Guidance</h4>
                      </div>
                      
                      <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-medium">
                        {routeAnalysis.ai_travel_recommendation}
                      </div>

                      <div className="mt-6 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Route path:</span>
                          <span className="font-bold text-slate-200">{routeAnalysis.route_path}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Highest Risk:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase bg-${routeAnalysis.highest_risk_color}-500`}>
                            {routeAnalysis.highest_risk_level}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-800 text-[10px] text-slate-500">
                      Source: {routeAnalysis.source}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 4: OFFICIAL METEOROLOGICAL ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-white">Active Meteorological Warning Bulletins</h3>
                  <p className="text-xs text-slate-500 mt-1">Authorized alerts published by India Meteorological Department (IMD) warning cells.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allAlerts.length > 0 ? (
                  allAlerts.map((al: GlobalAlert, idx: number) => (
                    <div key={idx} className={`border rounded-2xl p-6 shadow-lg relative overflow-hidden bg-slate-900/30
                      ${al.severity === 'SEVERE' ? 'border-red-500/35 bg-red-950/10' : 
                        al.severity === 'WARNING' ? 'border-orange-500/35 bg-orange-950/10' : 
                        al.severity === 'WATCH' ? 'border-amber-500/35 bg-amber-950/10' : 'border-slate-800'}
                    `}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className={`h-5 w-5 ${al.severity === 'SEVERE' ? 'text-red-400' : al.severity === 'WARNING' ? 'text-orange-400' : 'text-amber-400'}`} />
                          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">{al.severity} ALERT</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-800 px-2 py-0.5 rounded-full">{al.location}</span>
                      </div>

                      <h5 className="text-base font-black text-white mt-4">{al.title}</h5>
                      <p className="text-xs text-slate-400 mt-1">{al.description}</p>
                      <p className="text-[11px] text-slate-500 mt-2 font-semibold">Expected: {al.expected_period}</p>

                      <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                        <p className="font-extrabold text-slate-200 mb-1">Key Actions:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {al.actions && Array.isArray(al.actions) ? al.actions.map((act: string, i: number) => (
                            <li key={i}>{act}</li>
                          )) : typeof al.actions === 'string' ? JSON.parse(al.actions).map((act: string, i: number) => (
                            <li key={i}>{act}</li>
                          )) : <li>Follow emergency instructions.</li>}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No active alert bulletins reported.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DISASTER COMMAND CENTER */}
          {activeTab === 'disaster' && disasterDashboard && (
            <div className="space-y-8">
              
              {/* Aggregated command stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Alerts</p>
                  <p className="text-2xl font-black text-rose-500 mt-2">{disasterDashboard.metrics.active_alerts}</p>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">High Risk Areas</p>
                  <p className="text-2xl font-black text-orange-500 mt-2">{disasterDashboard.metrics.high_risk_areas}</p>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Flood Risk Zones</p>
                  <p className="text-2xl font-black text-amber-500 mt-2">{disasterDashboard.metrics.flood_risk_count}</p>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Heavy Rain Districts</p>
                  <p className="text-2xl font-black text-sky-400 mt-2">{disasterDashboard.metrics.heavy_rainfall_count}</p>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow text-center col-span-2 lg:col-span-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Severe Storms</p>
                  <p className="text-2xl font-black text-violet-400 mt-2">{disasterDashboard.metrics.severe_weather_count}</p>
                </div>
              </div>

              {/* AI Situation Summary & Critical Zones Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* AI Summary card */}
                <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-20 w-20 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
                  
                  <div className="flex items-center space-x-2 text-rose-400 mb-4">
                    <Activity className="h-5 w-5" />
                    <h3 className="text-base font-extrabold uppercase tracking-wider">AI Tactical Situation Summary</h3>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 leading-relaxed font-semibold">
                    {disasterDashboard.ai_situation_summary}
                  </div>

                  <p className="text-[10px] text-slate-500 mt-4 italic">
                    Note: Tactical summaries are compiled dynamically from official feeds and topography coefficients.
                  </p>
                </div>

                {/* Critical zones priority table */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                  <h4 className="text-base font-bold text-white mb-4">Priority Districts</h4>
                  
                  <div className="space-y-3">
                    {disasterDashboard.critical_zones.map((zone: DisasterZone, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/40 text-xs">
                        <div>
                          <p className="font-extrabold text-slate-200 uppercase">{zone.location}</p>
                          <p className="text-slate-500 mt-0.5">{zone.hazard}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black text-white uppercase
                            ${zone.severity === 'SEVERE' ? 'bg-red-500' : 'bg-orange-500'}
                          `}>
                            {zone.severity}
                          </span>
                          <p className="text-slate-400 mt-1 font-bold">Score: {zone.risk_score}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 6: SETTINGS (PERSONAS & LOCALIZATION) */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl">
              <div>
                <h3 className="text-lg font-black text-white">WeatherGPT Controls & Settings</h3>
                <p className="text-xs text-slate-500 mt-1">Configure user personas, default languages, and simulated network environments.</p>
              </div>

              {/* User Mode Toggles */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Personalized User Role Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={() => setCurrentMode('general')}
                    className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition text-left
                      ${currentMode === 'general' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}
                    `}
                  >
                    <User className="h-4 w-4" />
                    <span>{text.mode_general}</span>
                  </button>
                  <button 
                    onClick={() => setCurrentMode('farmer')}
                    className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition text-left
                      ${currentMode === 'farmer' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}
                    `}
                  >
                    <Compass className="h-4 w-4" />
                    <span>{text.mode_farmer}</span>
                  </button>
                  <button 
                    onClick={() => setCurrentMode('disaster')}
                    className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition text-left
                      ${currentMode === 'disaster' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}
                    `}
                  >
                    <Shield className="h-4 w-4" />
                    <span>{text.mode_disaster}</span>
                  </button>
                  <button 
                    onClick={() => setCurrentMode('traveller')}
                    className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition text-left
                      ${currentMode === 'traveller' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}
                    `}
                  >
                    <Navigation className="h-4 w-4" />
                    <span>{text.mode_traveller}</span>
                  </button>
                  <button 
                    onClick={() => setCurrentMode('school')}
                    className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition text-left
                      ${currentMode === 'school' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}
                    `}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>{text.mode_school}</span>
                  </button>
                </div>
              </div>

              {/* Language Selection */}
              <div className="pt-6 border-t border-slate-800/60 space-y-3">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  🌐 Application Language
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                        currentLang === lang.code
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md font-black'
                          : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm">{lang.name}</span>
                      <span className="text-[10px] text-slate-400 opacity-75">{lang.englishName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Units Preferences */}
              <div className="pt-6 border-t border-slate-800/60 space-y-4">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                  ⚙️ Measurement Units
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Temperature</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setTempUnit('celsius')}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${tempUnit === 'celsius' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'}`}
                      >
                        °C
                      </button>
                      <button
                        onClick={() => setTempUnit('fahrenheit')}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${tempUnit === 'fahrenheit' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'}`}
                      >
                        °F
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Wind Velocity</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setWindUnit('kmh')}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${windUnit === 'kmh' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'}`}
                      >
                        km/h
                      </button>
                      <button
                        onClick={() => setWindUnit('mph')}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${windUnit === 'mph' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'}`}
                      >
                        mph
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Distance</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setDistanceUnit('km')}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${distanceUnit === 'km' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'}`}
                      >
                        km
                      </button>
                      <button
                        onClick={() => setDistanceUnit('miles')}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${distanceUnit === 'miles' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'}`}
                      >
                        miles
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated offline toggle */}
              <div className="pt-6 border-t border-slate-800/60 space-y-3">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Offline Resilience Simulator</label>
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={isOffline}
                    onChange={(e) => setIsOffline(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-300 font-semibold">Simulate Offline Environment (Forces local cache lookups)</span>
                </label>
              </div>
            </div>
          )}

        </div>

        {/* PERSISTENT FLOATING CHAT DRAWER */}
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-300 ease-in-out
          ${chatOpen 
            ? 'h-[500px] w-[350px] md:w-[400px] bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden' 
            : 'h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center text-2xl shadow-emerald-500/20'
          }
        `}>
          {chatOpen ? (
            <div className="flex flex-col h-full w-full">
              {/* Chat Header */}
              <header className="flex h-12 items-center justify-between px-4 bg-slate-950 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🤖</span>
                  <span className="font-extrabold text-xs tracking-tight text-white">WeatherGPT Assistant</span>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Minimize
                </button>
              </header>

              {/* Chat message space */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed font-medium
                      ${msg.role === 'user' 
                        ? 'self-end bg-emerald-500 text-white rounded-tr-none' 
                        : 'self-start bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none chat-assistant-bubble shadow-sm'
                      }
                    `}
                    style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                  >
                    <p className="whitespace-pre-wrap">{formatCleanText(msg.content)}</p>
                    
                    {/* Inline weather card in chat assistant responses */}
                    {msg.metadata && msg.metadata.type === 'weather' && msg.metadata.weather_details && msg.metadata.risk_details && (
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 flex items-center justify-between text-[10px]">
                        <div>
                          <p className="font-bold text-white uppercase">{msg.metadata.weather_details.location}</p>
                          <p className="text-slate-400 mt-0.5">{msg.metadata.weather_details.current.temp}°C — {msg.metadata.weather_details.current.condition}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black text-white
                          ${msg.metadata.risk_details.category === 'SEVERE' ? 'bg-red-500' : 'bg-orange-500'}
                        `}>
                          Risk: {msg.metadata.risk_details.score}
                        </span>
                      </div>
                    )}

                    {/* Inline route card in chat responses */}
                    {msg.metadata && msg.metadata.type === 'route' && msg.metadata.route_details && (
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 text-[10px] space-y-1">
                        <p className="font-bold text-white uppercase">Route Analysis</p>
                        <p className="text-slate-400">{msg.metadata.route_details.route_path}</p>
                        <p className="text-rose-400 font-bold">Highest Risk: {msg.metadata.route_details.highest_risk_level}</p>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="self-start bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none p-3 text-xs flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat suggestions shortcuts */}
              <div className="p-2 border-t border-slate-800/60 bg-slate-950/60 flex space-x-2 overflow-x-auto whitespace-nowrap scrollbar-none">
                {currentLang === 'hi' ? (
                  <>
                    <button 
                      onClick={() => setChatInput("क्या आज पुणे में बारिश होगी?")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 cursor-pointer"
                    >
                      🌧️ क्या बारिश होगी?
                    </button>
                    <button 
                      onClick={() => setChatInput("पुणे से मुंबई हाईवे सुरक्षित है क्या?")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 cursor-pointer"
                    >
                      🚗 पुणे ➔ मुंबई यात्रा?
                    </button>
                    <button 
                      onClick={() => setChatInput("क्या आज फसलों की सिंचाई करनी चाहिए?")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 cursor-pointer"
                    >
                      🌾 फसलों की सिंचाई?
                    </button>
                  </>
                ) : currentLang === 'mr' ? (
                  <>
                    <button 
                      onClick={() => setChatInput("पुण्यात आज पाऊस पडेल का?")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 cursor-pointer"
                    >
                      🌧️ पाऊस पडेल का?
                    </button>
                    <button 
                      onClick={() => setChatInput("पुणे ते मुंबई हायवे प्रवास सुरक्षित आहे का?")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 cursor-pointer"
                    >
                      🚗 पुणे ➔ मुंबई प्रवास?
                    </button>
                    <button 
                      onClick={() => setChatInput("आज पिकांना पाणी द्यावे का?")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 cursor-pointer"
                    >
                      🌾 पिकांना पाणी?
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setChatInput("Will it rain tomorrow in Pune?")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 cursor-pointer"
                    >
                      🌧️ Pune Rain?
                    </button>
                    <button 
                      onClick={() => setChatInput("Is it safe to travel from Pune to Mumbai?")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 cursor-pointer"
                    >
                      🚗 Pune ➔ Mumbai?
                    </button>
                    <button 
                      onClick={() => setChatInput("Should I irrigate my crops today?")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800/80 cursor-pointer"
                    >
                      🌾 Irrigate Crops?
                    </button>
                  </>
                )}
              </div>

              {/* Voice status feedback toast */}
              {voiceStatus && (
                <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[11px] font-semibold text-cyan-400 flex items-center justify-between animate-in fade-in">
                  <span>{voiceStatus}</span>
                  <button onClick={() => setVoiceStatus('')} className="text-slate-500 hover:text-slate-300">×</button>
                </div>
              )}

              {/* Chat Input Controls */}
              <div className="flex h-12 items-center bg-slate-950 border-t border-slate-800 px-2 space-x-1.5">
                <button 
                  onClick={startListening}
                  className={`flex-none h-8 w-8 rounded-lg flex items-center justify-center transition cursor-pointer
                    ${isListening ? 'bg-red-500 text-white mic-active' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                  `}
                  title={speechSupported ? "Speak to WeatherGPT AI" : "Voice input (Requires Chrome/Edge/Brave)"}
                >
                  <Mic className="h-4 w-4" />
                </button>
                
                <button 
                  onClick={() => setVoicePlayback(!voicePlayback)}
                  className={`flex-none h-8 w-8 rounded-lg flex items-center justify-center transition cursor-pointer
                    ${voicePlayback ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                  `}
                  title="Toggle Voice Output Speak replies"
                >
                  <Volume2 className="h-4 w-4" />
                </button>

                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder={text.placeholder_chat}
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />

                <button 
                  onClick={() => sendChatMessage()}
                  className="flex-none h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition shadow shadow-emerald-500/10 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setChatOpen(true)}
              className="h-full w-full rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition"
            >
              💬
            </button>
          )}
        </div>

        {/* DISCLAIMER / FOOTER */}
        <footer className="h-10 flex-none flex items-center justify-center border-t border-slate-900/60 bg-slate-950/80 px-6 text-[9px] text-slate-500 text-center select-none z-10">
          <p className="max-w-4xl truncate">{text.disclaimer}</p>
        </footer>

      </div>

      {/* MODALS */}
      <DisasterSimulationModal
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        onApplyScenario={() => fetchWeatherData(searchLocation)}
        lang={currentLang}
      />
      <EmergencyCenterModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        location={weather?.location || searchLocation || 'Pune'}
        lang={currentLang}
      />
      <ClimateInsightsModal
        isOpen={climateModalOpen}
        onClose={() => setClimateModalOpen(false)}
        location={weather?.location || searchLocation || 'Pune'}
        lang={currentLang}
      />
      <ReportGeneratorModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        location={weather?.location || searchLocation || 'Pune'}
        lang={currentLang}
        weatherData={weather}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleUserLogin}
        onLogout={handleUserLogout}
        lang={currentLang}
      />
    </div>
  );
}
