/**
 * WeatherGPT - Centralized Domain & API Types
 */

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
  rain?: number;
  cc?: string;
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

export type UserRole = 'general' | 'farmer' | 'driver' | 'emergency' | 'admin' | 'operator';
export type OperationalMode = 'public' | 'kisan' | 'aviation' | 'smart_city';
export type NwpModel = 'ensemble' | 'gfs' | 'ecmwf' | 'icon';
export type ActiveTab = 'dashboard' | 'route' | 'alerts' | 'map' | 'settings';

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  role: UserRole;
  phone?: string;
}

export interface ApiResponse<T> {
  data?: T;
  status?: string;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
}
