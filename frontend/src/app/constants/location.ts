/**
 * WeatherGPT - Centralized Location Configuration
 * Default location: Nashik, Maharashtra, India
 */

export interface LocationConfig {
  city: string;
  state: string;
  country: string;
  fullName: string;
  lat: number;
  lon: number;
  coordinates: [number, number];
}

export const DEFAULT_LOCATION: LocationConfig = {
  city: "Nashik",
  state: "Maharashtra",
  country: "India",
  fullName: "Nashik, Maharashtra",
  lat: 20.0059,
  lon: 73.7797,
  coordinates: [20.0059, 73.7797],
};
