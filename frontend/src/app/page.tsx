"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  CloudRain, Sun, Moon, Cloud, CloudLightning, Wind, Compass, 
  Navigation, AlertTriangle, Shield, 
  Map as MapIcon, Send, Mic, Volume2, Heart, Settings as SettingsIcon,
  ChevronRight, RefreshCw, Layers, CheckCircle2, User, Activity, GraduationCap,
  Sliders, PhoneCall, TrendingUp, FileText, Droplets, Thermometer, Sparkles, LogIn
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
  translateCondition, 
  translateRiskCategory, 
  translateRiskFactor, 
  translateDay, 
  translateRecommendation, 
  SupportedLanguage 
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

export interface WeatherForecastItem {
  day: string;
  temp: number;
  condition: string;
  icon: string;
  rain_probability: number;
  wind: number;
  humidity: number;
  risk_level: string;
  recommendation: string;
}

export interface WeatherAlert {
  title: string;
  expected_period: string;
  impacts: string[];
  actions: string[];
}

export interface WeatherData {
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  current: WeatherCurrent;
  forecast: WeatherForecastItem[];
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

// Using centralized localization bundle from i18n.ts
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function WeatherGPT() {
  // Navigation & Localization States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'route' | 'alerts' | 'disaster' | 'settings'>('dashboard');
  const [currentLang, setCurrentLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [currentMode, setCurrentMode] = useState<'general' | 'traveller' | 'farmer' | 'disaster' | 'school'>('general');
  const [searchLocation, setSearchLocation] = useState<string>('Pune');
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.5204, 73.8567]);
  const [activeMapLayer, setActiveMapLayer] = useState<'temp' | 'rain' | 'wind' | 'risk'>('temp');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Weather Data States
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);
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

      const win = window as unknown as SpeechRecognitionWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setTimeout(() => {
          setSpeechSupported(true);
        }, 0);
      }
    }
  }, []);

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

  // Fetch weather data function
  const fetchWeatherData = useCallback(async (loc: string) => {
    setIsRefreshing(true);
    try {
      if (isOffline) {
        // Fallback to local storage cache if offline
        const cached = localStorage.getItem(`weather_cache_${loc.toLowerCase()}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setWeather(parsed.weather);
          setRisk(parsed.risk);
          setIsRefreshing(false);
          return;
        }
      }

      const res = await fetch(`${BACKEND_URL}/api/weather/current?location=${encodeURIComponent(loc)}`);
      if (res.ok) {
        const data = await res.json();
        setWeather(data.weather);
        setRisk(data.risk);
        if (data.weather?.coordinates?.lat && data.weather?.coordinates?.lon) {
          setMapCenter([data.weather.coordinates.lat, data.weather.coordinates.lon]);
        }
        
        // Cache to local storage
        localStorage.setItem(`weather_cache_${loc.toLowerCase()}`, JSON.stringify(data));
      } else {
        throw new Error("Failed to fetch weather");
      }
    } catch (e) {
      console.error(e);
      // Serve comprehensive 7-day offline fallback so charts and forecast grids are never blank
      const generateFallbackForecast = (baseTemp: number, baseRain: number): WeatherForecastItem[] => {
        const days = ["Today", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const conditions = [
          { cond: "Heavy Rain", icon: "cloud-lightning", risk: "SEVERE", rec: "Secure property and avoid non-essential travel." },
          { cond: "Thunderstorm", icon: "cloud-lightning", risk: "HIGH", rec: "Stay indoors during peak lightning hours." },
          { cond: "Moderate Rain", icon: "cloud-rain", risk: "MODERATE", rec: "Carry rain gear and drive carefully." },
          { cond: "Light Showers", icon: "cloud-drizzle", risk: "LOW", rec: "Light raincoat or umbrella recommended." },
          { cond: "Overcast Clouds", icon: "cloud", risk: "LOW", rec: "Good conditions for general outdoor work." },
          { cond: "Partly Cloudy", icon: "sun", risk: "LOW", rec: "Pleasant outdoor weather expected." },
          { cond: "Clear Sky", icon: "sun", risk: "LOW", rec: "Ideal travel and harvesting conditions." }
        ];
        return days.map((d, i) => ({
          day: d,
          temp: Math.round(baseTemp + (i % 3) * 1.5 - (i > 3 ? 2 : 0)),
          condition: conditions[i % conditions.length].cond,
          icon: conditions[i % conditions.length].icon,
          rain_probability: Math.max(10, Math.min(95, baseRain - i * 11 + (i % 2 === 0 ? 15 : -5))),
          wind: 14 + (i * 2) % 10,
          humidity: Math.max(45, Math.min(92, 85 - i * 5)),
          risk_level: conditions[i % conditions.length].risk,
          recommendation: conditions[i % conditions.length].rec
        }));
      };

      const locName = loc ? (loc.charAt(0).toUpperCase() + loc.slice(1)) : "Pune";
      const fallbackWeather: WeatherData = {
        location: `${locName} (Offline / Cached Mode)`,
        current: {
          temp: 27,
          feels_like: 29.5,
          condition: "Heavy Rain",
          humidity: 88,
          wind_speed: 18,
          rain_probability: 88,
          air_quality: "Good (AQI 38)",
          sunrise: "06:14 AM",
          sunset: "06:58 PM",
          icon: "cloud-lightning",
          source: "Offline Local Storage"
        },
        forecast: generateFallbackForecast(27, 88)
      };

      setWeather(fallbackWeather);
      setRisk({
        score: 78,
        category: "HIGH",
        color: "orange",
        breakdown: [
          { factor: "Precipitation Rate", score: 85, description: "High localized rainfall" },
          { factor: "Wind Gusts", score: 45, description: "Moderate surface gusts" },
          { factor: "Atmospheric Humidity", score: 88, description: "Saturated tropospheric layers" }
        ]
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isOffline]);

  const handleUseCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsRefreshing(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setMapCenter([lat, lon]);
          const coordStr = `${lat.toFixed(4)},${lon.toFixed(4)}`;
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
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (!active) return;
      fetchWeatherData(searchLocation);
      fetchDisasterMetrics();
      fetchGlobalAlerts();
    };
    load();
    return () => {
      active = false;
    };
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
      }
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, {
        id: generateMessageId() + 2,
        role: 'assistant' as const,
        content: "Sorry, I am having trouble connecting to the AI brain right now. The local rule-based engine is offline.",
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
      recognition.lang = currentLang === 'hi' ? 'hi-IN' : (currentLang === 'mr' ? 'mr-IN' : 'en-US');
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
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'light' ? 'light-mode' : ''} bg-slate-950 text-slate-100 font-sans relative`}>
        {/* SIDEBAR NAVIGATION - Premium Dark Glassmorphism */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-900/40 backdrop-blur-lg border-r border-slate-800/80 p-6 space-y-8 select-none z-10">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
            ⛈️
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-slate-100">
              {text.app_title}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/80">IMD Copilot</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl transition duration-150 text-sm font-semibold
              ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-md' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}
            `}
          >
            <Activity className="h-5 w-5" />
            <span>{text.nav_dashboard}</span>
          </button>

          <button 
            onClick={() => setActiveTab('map')}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl transition duration-150 text-sm font-semibold
              ${activeTab === 'map' ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-md' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}
            `}
          >
            <MapIcon className="h-5 w-5" />
            <span>{text.nav_map}</span>
          </button>

          <button 
            onClick={() => setActiveTab('route')}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl transition duration-150 text-sm font-semibold
              ${activeTab === 'route' ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-md' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}
            `}
          >
            <Navigation className="h-5 w-5" />
            <span>{text.nav_route}</span>
          </button>

          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl transition duration-150 text-sm font-semibold
              ${activeTab === 'alerts' ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-md' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}
            `}
          >
            <AlertTriangle className="h-5 w-5" />
            <span>{text.nav_alerts}</span>
          </button>

          <button 
            onClick={() => setActiveTab('disaster')}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl transition duration-150 text-sm font-semibold
              ${activeTab === 'disaster' ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-md' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}
            `}
          >
            <Shield className="h-5 w-5" />
            <span>{text.nav_disaster}</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl transition duration-150 text-sm font-semibold
              ${activeTab === 'settings' ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-md' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}
            `}
          >
            <SettingsIcon className="h-5 w-5" />
            <span>{text.nav_settings}</span>
          </button>

          <div className="pt-4 space-y-1.5 border-t border-slate-800/60">
            <span className="px-4 text-[10px] uppercase font-bold tracking-wider text-slate-500">{text.advanced_tools}</span>
            <button
              onClick={() => setSimModalOpen(true)}
              className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Sliders className="h-4 w-4 text-rose-400" />
              <span>{text.disaster_sim}</span>
            </button>

            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
            >
              <PhoneCall className="h-4 w-4 text-red-400" />
              <span>{text.emergency_center}</span>
            </button>

            <button
              onClick={() => setClimateModalOpen(true)}
              className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 transition"
            >
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span>{text.climate_insights}</span>
            </button>

            <button
              onClick={() => setReportModalOpen(true)}
              className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition"
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>{text.export_report}</span>
            </button>
          </div>
        </nav>

        {/* User Info / Attribution */}
        <div className="pt-6 border-t border-slate-800/60 text-[11px] text-slate-500">
          <p>© MoES - Govt of India</p>
          <p className="mt-1">Department of Meteorology</p>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
        
        {/* HEADER BAR */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-slate-900/60 bg-slate-900/20 backdrop-blur-md z-10 select-none">
          <div className="flex-1 flex items-center space-x-4 max-w-2xl mr-4">
            {/* Mobile Sidebar Hamburger Toggle */}
            <div className="md:hidden flex items-center space-x-2 shrink-0">
              <span className="text-xl">⛈️</span>
              <span className="font-extrabold text-slate-100 hidden sm:inline">{text.app_title}</span>
            </div>
            
            {/* Location Autocomplete Search Bar */}
            <LocationSearchBar
              currentLocation={weather?.location || searchLocation}
              onSelectLocation={(locItem: LocationItem) => {
                setSearchLocation(locItem.name);
                if (locItem.lat && locItem.lon) {
                  setMapCenter([locItem.lat, locItem.lon]);
                }
                fetchWeatherData(locItem.name);
              }}
              onUseGps={handleUseCurrentLocation}
              isGpsLoading={isRefreshing}
            />
          </div>

          {/* RIGHT CONTROLS: Language, Mode, Offline indicators */}
          <div className="flex items-center space-x-3">
            {/* Active Mode Indicator Badge */}
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700/50">
              <User className="h-3.5 w-3.5" />
              <span>{currentMode === 'general' ? text.mode_general : currentMode === 'farmer' ? text.mode_farmer : currentMode === 'disaster' ? text.mode_disaster : currentMode === 'traveller' ? text.mode_traveller : text.mode_school}</span>
            </span>

            {/* Offline/Online Status Indicator */}
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border
              ${isOffline 
                ? 'bg-rose-950/60 border-rose-500/30 text-rose-300' 
                : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              }
            `}>
              <span className={`h-2 w-2 rounded-full ${isOffline ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              <span>{isOffline ? text.status_offline : text.status_online}</span>
            </span>

            {/* Language Selection */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 shadow-md">
              <button 
                onClick={() => setCurrentLang('en')} 
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${currentLang === 'en' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setCurrentLang('hi')} 
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${currentLang === 'hi' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                हिं
              </button>
              <button 
                onClick={() => setCurrentLang('mr')} 
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${currentLang === 'mr' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                मरा
              </button>
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 transition shadow-md flex items-center justify-center cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-indigo-400" />}
            </button>

            {/* User Profile / Auth Modal Trigger */}
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span className="max-w-[100px] truncate">{currentUser ? currentUser.name : 'Login / Guest'}</span>
              {currentUser?.isGuest && <span className="px-1.5 py-0.5 text-[9px] bg-emerald-950/80 rounded text-emerald-300 border border-emerald-500/30">Guest</span>}
            </button>
          </div>
        </header>

        {/* MOBILE NAVIGATION - Top select bar */}
        <div className="md:hidden flex bg-slate-900 border-b border-slate-800 p-2 overflow-x-auto whitespace-nowrap select-none">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'dashboard' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>{text.nav_dashboard}</button>
          <button onClick={() => setActiveTab('map')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'map' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>{text.nav_map}</button>
          <button onClick={() => setActiveTab('route')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'route' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>{text.nav_route}</button>
          <button onClick={() => setActiveTab('alerts')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'alerts' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>{text.nav_alerts}</button>
          <button onClick={() => setActiveTab('disaster')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'disaster' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>{text.nav_disaster}</button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'settings' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}>{text.nav_settings}</button>
        </div>

        {/* TAB WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 select-text">

          {/* TAB 1: WEATHER DASHBOARD */}
          {activeTab === 'dashboard' && weather && (
            <div className="space-y-6">
              
              {/* Popular & Trending Locations Quick Switcher Ribbon */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar select-none">
                <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Prominent Hubs:
                </span>
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
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 scale-105 border border-emerald-400'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>{hub.icon}</span>
                      <span>{hub.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isCurrent ? 'bg-slate-950/30 text-slate-900 font-extrabold' : 'bg-slate-800 text-emerald-400'
                      }`}>
                        {hub.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left & Middle Column (Main Weather Info) */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* Current Weather Card */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase">{weather.location}</h2>
                      <p className="text-xs text-slate-400 mt-1 flex items-center">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                        {text.source}: {weather.current.source} ({weather.current.updated_at})
                      </p>
                    </div>
                    {isRefreshing && <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />}
                  </div>

                  <div className="flex flex-col md:flex-row items-center md:items-end justify-between mt-8 gap-6">
                    <div className="flex items-center space-x-6">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/40 shadow-inner">
                        {getWeatherIcon(weather.current.icon)}
                      </div>
                      <div>
                        <span className="text-5xl md:text-6xl font-black text-white leading-none tracking-tighter">
                          {weather.current.temp}°C
                        </span>
                        <h3 className="text-lg font-bold text-slate-300 mt-1">{translateCondition(weather.current.condition, currentLang)}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full md:w-auto text-sm border-t md:border-t-0 border-slate-800/80 pt-4 md:pt-0">
                      <div className="text-slate-400">{text.feels_like}: <span className="font-semibold text-slate-200">{weather.current.feels_like}°C</span></div>
                      <div className="text-slate-400">{text.humidity}: <span className="font-semibold text-slate-200">{weather.current.humidity}%</span></div>
                      <div className="text-slate-400">{text.wind}: <span className="font-semibold text-slate-200">{weather.current.wind_speed} km/h {weather.current.wind_direction}</span></div>
                      <div className="text-slate-400">{text.precipitation}: <span className="font-semibold text-slate-200">{weather.current.rain_probability}%</span></div>
                    </div>
                  </div>

                  {/* Micro dashboard parameters block */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80 text-center">
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/40">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{text.atm_pressure}</p>
                      <p className="text-sm font-extrabold text-slate-200 mt-1">{weather.current.pressure} hPa</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/40">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{text.visibility}</p>
                      <p className="text-sm font-extrabold text-slate-200 mt-1">{weather.current.visibility} km</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/40">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{text.uv_index}</p>
                      <p className="text-sm font-extrabold text-slate-200 mt-1">{weather.current.uv_index}</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/40">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{text.air_quality}</p>
                      <p className="text-xs font-extrabold text-emerald-400 mt-1 truncate">{weather.current.air_quality}</p>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC PERSONA MODE ADVISORY BANNER */}
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">
                        {text.active_operating_mode}
                      </span>
                      <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                        {currentMode === 'farmer' && text.mode_title_farmer}
                        {currentMode === 'traveller' && text.mode_title_traveller}
                        {currentMode === 'school' && text.mode_title_school}
                        {currentMode === 'disaster' && text.mode_title_disaster}
                        {currentMode === 'general' && text.mode_title_general}
                      </h3>
                    </div>
                    
                    {/* Interactive Mode Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: 'general', label: text.mode_pill_public, icon: User },
                        { id: 'farmer', label: text.mode_pill_farmer, icon: GraduationCap },
                        { id: 'traveller', label: text.mode_pill_traveller, icon: Navigation },
                        { id: 'school', label: text.mode_pill_school, icon: Shield },
                        { id: 'disaster', label: text.mode_pill_disaster, icon: AlertTriangle }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setCurrentMode(m.id as 'general' | 'traveller' | 'farmer' | 'disaster' | 'school')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            currentMode === m.id
                              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode-Specific Information Content */}
                  {currentMode === 'farmer' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                        <span className="font-bold text-emerald-400 block mb-1">{text.farmer_irrigation_title}</span>
                        <p className="text-slate-300">{text.farmer_irrigation_desc}</p>
                      </div>
                      <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                        <span className="font-bold text-emerald-400 block mb-1">{text.farmer_spraying_title}</span>
                        <p className="text-slate-300">{text.farmer_spraying_desc}</p>
                      </div>
                      <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                        <span className="font-bold text-emerald-400 block mb-1">{text.farmer_produce_title}</span>
                        <p className="text-slate-300">{text.farmer_produce_desc}</p>
                      </div>
                    </div>
                  )}

                  {currentMode === 'traveller' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl">
                        <span className="font-bold text-amber-400 block mb-1">{text.traveller_vis_title}</span>
                        <p className="text-slate-300">{text.traveller_vis_desc}</p>
                      </div>
                      <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl">
                        <span className="font-bold text-amber-400 block mb-1">{text.traveller_hydro_title}</span>
                        <p className="text-slate-300">{text.traveller_hydro_desc}</p>
                      </div>
                      <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl">
                        <span className="font-bold text-amber-400 block mb-1">{text.traveller_hours_title}</span>
                        <p className="text-slate-300">{text.traveller_hours_desc}</p>
                      </div>
                    </div>
                  )}

                  {currentMode === 'school' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-cyan-950/20 border border-cyan-500/30 p-3 rounded-xl">
                        <span className="font-bold text-cyan-400 block mb-1">{text.school_sports_title}</span>
                        <p className="text-slate-300">{text.school_sports_desc}</p>
                      </div>
                      <div className="bg-cyan-950/20 border border-cyan-500/30 p-3 rounded-xl">
                        <span className="font-bold text-cyan-400 block mb-1">{text.school_lightning_title}</span>
                        <p className="text-slate-300">{text.school_lightning_desc}</p>
                      </div>
                      <div className="bg-cyan-950/20 border border-cyan-500/30 p-3 rounded-xl">
                        <span className="font-bold text-cyan-400 block mb-1">{text.school_bus_title}</span>
                        <p className="text-slate-300">{text.school_bus_desc}</p>
                      </div>
                    </div>
                  )}

                  {currentMode === 'disaster' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl">
                        <span className="font-bold text-rose-400 block mb-1">{text.disaster_river_title}</span>
                        <p className="text-slate-300">{text.disaster_river_desc}</p>
                      </div>
                      <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl">
                        <span className="font-bold text-rose-400 block mb-1">{text.disaster_rescue_title}</span>
                        <p className="text-slate-300">{text.disaster_rescue_desc}</p>
                      </div>
                      <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl">
                        <span className="font-bold text-rose-400 block mb-1">{text.disaster_public_title}</span>
                        <p className="text-slate-300">{text.disaster_public_desc}</p>
                      </div>
                    </div>
                  )}

                  {currentMode === 'general' && (
                    <div className="bg-slate-950/50 p-3 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                      <span><strong>{text.general_rec_prefix}</strong> {translateCondition(weather.current.condition, currentLang)} ({weather.current.rain_probability}%).</span>
                    </div>
                  )}
                </div>

                {/* 7-Day Forecast Grid */}
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-slate-200 mb-4">{text.label_forecast}</h3>
                  <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800">
                    {weather.forecast.map((fc: WeatherForecastItem, idx: number) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedForecastIndex(idx)}
                        className={`flex-none w-32 p-4 rounded-xl border transition text-center select-none cursor-pointer shadow-sm
                          ${selectedForecastIndex === idx 
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md ring-2 ring-emerald-500/30 font-bold' 
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-slate-100'
                          }
                        `}
                      >
                        <p className="text-xs font-bold">{translateDay(fc.day, currentLang)}</p>
                        <div className="flex justify-center my-3">{getWeatherIcon(fc.icon)}</div>
                        <p className="text-base font-black text-white">{fc.temp}°C</p>
                        <span className={`inline-block mt-2 px-1.5 py-0.5 rounded text-[8px] font-black text-white
                          ${fc.risk_level === 'SEVERE' ? 'bg-red-500' : 
                            fc.risk_level === 'HIGH' ? 'bg-orange-500' : 
                            fc.risk_level === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'}
                        `}>
                          {translateRiskCategory(fc.risk_level, currentLang)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Day forecast details */}
                  {weather.forecast[selectedForecastIndex] && (
                    <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div>
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-500">{text.day_details}</span>
                        <h4 className="text-base font-black text-white mt-0.5">
                          {translateDay(weather.forecast[selectedForecastIndex].day, currentLang)} — {translateCondition(weather.forecast[selectedForecastIndex].condition, currentLang)}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl">
                          <span className="font-bold text-slate-300">{text.ai_advice}</span> {translateRecommendation(weather.forecast[selectedForecastIndex].recommendation, currentLang)}
                        </p>
                      </div>
                      
                      <div className="flex gap-6 text-xs text-slate-400 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 w-full md:w-auto">
                        <div>{text.rain_prob}: <span className="font-bold text-slate-200">{weather.forecast[selectedForecastIndex].rain_probability}%</span></div>
                        <div>{text.wind}: <span className="font-bold text-slate-200">{weather.forecast[selectedForecastIndex].wind} km/h</span></div>
                        <div>{text.humidity}: <span className="font-bold text-slate-200">{weather.forecast[selectedForecastIndex].humidity}%</span></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upgraded Dynamic Analytics Graphs with Dual Mode (Precipitation & Temperature) */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  
                  {/* Header with Title & Tab Switcher */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-cyan-400" />
                        <h3 className="text-lg font-bold text-slate-100">{text.trend_title}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{text.trend_subtitle}</p>
                    </div>

                    {/* Tab Toggle: Rain % vs Temp °C */}
                    <div className="flex bg-slate-950/80 p-1 border border-slate-800 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => setChartMode('rain')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                          chartMode === 'rain'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Droplets className="h-3.5 w-3.5" />
                        {text.tab_precipitation}
                      </button>
                      <button
                        onClick={() => setChartMode('temp')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                          chartMode === 'temp'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Thermometer className="h-3.5 w-3.5" />
                        {text.tab_temperature}
                      </button>
                    </div>
                  </div>

                  {/* Chart Container with Fixed Parent Height */}
                  <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800/60 chart-container-track">
                    {weather.forecast.map((fc: WeatherForecastItem, idx: number) => {
                      const isRainMode = chartMode === 'rain';
                      const displayVal = isRainMode ? `${fc.rain_probability}%` : `${fc.temp}°C`;
                      
                      // Calculate normalized height percentage for chart bars
                      const barHeightPercent = isRainMode 
                        ? Math.max(fc.rain_probability, 8) 
                        : Math.min(Math.max(((fc.temp - 10) / 35) * 100, 15), 100);

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer">
                          
                          {/* Tooltip on Hover */}
                          <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 bg-slate-900 border border-slate-700 text-slate-100 text-[11px] p-2 rounded-xl shadow-2xl whitespace-nowrap flex flex-col items-center">
                            <span className="font-bold text-cyan-300">{translateDay(fc.day, currentLang)}</span>
                            <span>{translateCondition(fc.condition, currentLang)} • {fc.temp}°C</span>
                            <span className="text-[10px] text-slate-400">Rain: {fc.rain_probability}% | Wind: {fc.wind} km/h</span>
                          </div>

                          {/* Value Badge on top of bar */}
                          <span className={`text-[11px] font-black mb-2 transition-transform duration-300 group-hover:-translate-y-1 ${
                            isRainMode ? 'text-cyan-300' : 'text-amber-300'
                          }`}>
                            {displayVal}
                          </span>

                          {/* Bar Container Track with Explicit Height */}
                          <div className="w-full h-32 bg-slate-900/90 border border-slate-800 rounded-t-xl overflow-hidden flex items-end relative p-1 shadow-inner chart-bar-well">
                            {/* Grid lines inside bar track */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_16px] pointer-events-none" />
                            
                            {/* Filled Animated Bar */}
                            <div 
                              className={`w-full rounded-t-lg transition-all duration-700 ease-out shadow-lg ${
                                isRainMode 
                                  ? 'bg-gradient-to-t from-cyan-600 via-teal-500 to-emerald-400 group-hover:from-cyan-400 group-hover:to-emerald-300 bar-glow-cyan' 
                                  : 'bg-gradient-to-t from-orange-600 via-amber-500 to-yellow-400 group-hover:from-orange-400 group-hover:to-yellow-300 bar-glow'
                              }`}
                              style={{ height: `${barHeightPercent}%` }}
                            />
                          </div>

                          {/* Day & Icon */}
                          <div className="mt-3 flex flex-col items-center">
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-cyan-400 transition">
                              {translateDay(fc.day, currentLang).substring(0, 4)}
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium truncate max-w-[60px] text-center">{translateCondition(fc.condition, currentLang)}</span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: AI Risk Engine & Official Alerts */}
              <div className="space-y-8">
                
                {/* Weather Risk Engine Card */}
                {risk && (
                  <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <h3 className="text-md font-bold text-slate-200">{text.label_risk}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black text-white uppercase
                          ${risk.category === 'SEVERE' ? 'bg-red-500 animate-pulse' : 
                            risk.category === 'HIGH' ? 'bg-orange-500' : 
                            risk.category === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'}
                        `}>
                          {translateRiskCategory(risk.category, currentLang)}
                        </span>
                      </div>

                      {/* Large circular risk layout */}
                      <div className="flex flex-col items-center justify-center my-6">
                        <div className={`relative flex h-28 w-28 items-center justify-center rounded-full border-4 shadow-inner
                          ${risk.category === 'SEVERE' ? 'border-red-500' : 
                            risk.category === 'HIGH' ? 'border-orange-500' : 
                            risk.category === 'MODERATE' ? 'border-amber-500' : 'border-emerald-500'}
                        `}>
                          <span className="text-3xl font-black text-white">{risk.score}</span>
                          <span className="text-[9px] text-slate-400 absolute bottom-3">/ 100</span>
                        </div>
                      </div>

                      {/* Risk breakdown parameters */}
                      <div className="space-y-2 mt-4">
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">{text.label_why}</h4>
                        <div className="space-y-1 text-xs">
                          {risk.breakdown.length > 0 ? (
                            risk.breakdown.map((item: RiskFactor, idx: number) => (
                              <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                                <span className="text-slate-300">{translateRiskFactor(item.factor, currentLang)}</span>
                                <span className="font-extrabold text-emerald-400">+{item.weight}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500 italic py-2">{text.no_risk_indicators}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 italic">
                      {risk.disclaimer}
                    </div>
                  </div>
                )}

                {/* Smart Disaster Alert Card */}
                {weather.alerts && weather.alerts.length > 0 ? (
                  weather.alerts.map((al: WeatherAlert, idx: number) => (
                    <div key={idx} className="bg-rose-950/20 border-2 border-rose-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute right-0 top-0 h-16 w-16 bg-rose-500/10 rounded-full blur-2xl" />
                      
                      <div className="flex items-center space-x-2 text-rose-500">
                        <AlertTriangle className="h-5 w-5 animate-bounce" />
                        <h3 className="text-sm font-extrabold uppercase tracking-wider">🔴 ACTIVE WARNING</h3>
                      </div>

                      <h4 className="text-base font-black text-white mt-3">{al.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Location: {weather.location}</p>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Period: {al.expected_period}</p>

                      <div className="mt-4 text-xs text-slate-300">
                        <p className="font-bold text-slate-200">Potential Impacts:</p>
                        <ul className="list-disc pl-4 space-y-1 mt-1">
                          {al.impacts.map((imp: string, i: number) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-4 border-t border-rose-500/15 text-xs text-emerald-300 bg-emerald-950/25 p-3 rounded-lg border border-emerald-500/15">
                        <p className="font-extrabold text-slate-100 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-400" />
                          Recommended Emergency Actions:
                        </p>
                        <ul className="list-decimal pl-4 space-y-1 mt-1.5">
                          {al.actions.map((act: string, i: number) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 text-center shadow-xl">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                    <h4 className="font-bold text-slate-300 mt-3">{text.no_active_warnings}</h4>
                    <p className="text-xs text-slate-500 mt-1">{text.clear_area_msg}</p>
                  </div>
                )}

              </div>

            </div>
          </div>
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
                  placeholder={text.placeholder_search}
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

      </main>

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
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleUserLogin}
        onLogout={handleUserLogout}
      />
    </div>
  );
}
