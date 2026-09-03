"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MapLocationData {
  name: string;
  lat: number;
  lon: number;
  temp: string;
  condition: string;
  wind_speed: string;
  rain_prob: string;
  risk: string;
  color: string;
  alert: string;
}

const INITIAL_LOCATIONS: MapLocationData[] = [
  { name: "Pune", lat: 18.5204, lon: 73.8567, temp: "27°C", condition: "Heavy Rain", wind_speed: "18 km/h", rain_prob: "92%", risk: "SEVERE", color: "red", alert: "Red Alert: Extreme Rainfall Watch" },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, temp: "29°C", condition: "Moderate Rain", wind_speed: "22 km/h", rain_prob: "80%", risk: "HIGH", color: "orange", alert: "Orange Warning: High Tide Ingress" },
  { name: "Nashik", lat: 19.9975, lon: 73.7898, temp: "26°C", condition: "Moderate Rain", wind_speed: "16 km/h", rain_prob: "65%", risk: "MODERATE", color: "amber", alert: "Yellow Watch: Active Rainfall" },
  { name: "Lonavala", lat: 18.7557, lon: 73.4091, temp: "21°C", condition: "Torrential Rain", wind_speed: "28 km/h", rain_prob: "98%", risk: "SEVERE", color: "red", alert: "Red Alert: Landslide Watch" },
  { name: "Khopoli", lat: 18.7904, lon: 73.3424, temp: "25°C", condition: "Heavy Rain", wind_speed: "22 km/h", rain_prob: "90%", risk: "HIGH", color: "orange", alert: "Orange Alert: River Level Surge" },
  { name: "Panvel", lat: 18.9894, lon: 73.1175, temp: "27°C", condition: "Moderate Rain", wind_speed: "16 km/h", rain_prob: "75%", risk: "MODERATE", color: "amber", alert: "Yellow Watch: Active Precipitation" },
  { name: "Delhi", lat: 28.7041, lon: 77.1025, temp: "38°C", condition: "Heatwave", wind_speed: "12 km/h", rain_prob: "5%", risk: "SEVERE", color: "red", alert: "Red Alert: Thermal Stress" },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, temp: "24°C", condition: "Drizzle", wind_speed: "10 km/h", rain_prob: "30%", risk: "LOW", color: "green", alert: "None" },
  { name: "Chennai", lat: 13.0827, lon: 80.2707, temp: "31°C", condition: "Partly Cloudy", wind_speed: "14 km/h", rain_prob: "20%", risk: "LOW", color: "green", alert: "None" },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867, temp: "29°C", condition: "Partly Cloudy", wind_speed: "11 km/h", rain_prob: "15%", risk: "LOW", color: "green", alert: "None" },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873, temp: "35°C", condition: "Sunny", wind_speed: "14 km/h", rain_prob: "10%", risk: "LOW", color: "green", alert: "None" },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639, temp: "32°C", condition: "Humid", wind_speed: "16 km/h", rain_prob: "45%", risk: "MODERATE", color: "amber", alert: "None" }
];

// Helper to recolor marker pin programmatically using Leaflet divIcon
const createCustomIcon = (color: string, label: string, isCurrent: boolean = false) => {
  const markerColors: Record<string, string> = {
    red: '#f43f5e',     // rose-500
    orange: '#f97316',  // orange-500
    amber: '#f59e0b',   // amber-500
    green: '#10b981'    // emerald-500
  };

  const hexColor = markerColors[color] || '#3b82f6';
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex ${isCurrent ? 'h-10 w-10 opacity-75' : 'h-7 w-7 opacity-40'} animate-ping rounded-full" style="background-color: ${hexColor}"></span>
        <div class="relative flex h-9 px-2.5 items-center justify-center rounded-full border-2 ${isCurrent ? 'border-amber-300 ring-2 ring-emerald-400' : 'border-white'} text-[10px] font-bold text-white shadow-2xl whitespace-nowrap cursor-pointer transition-transform hover:scale-110" style="background-color: ${hexColor}">
          ${isCurrent ? '📍 ' : ''}${label}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 8), {
      duration: 1.2
    });
  }, [center, map]);
  return null;
}

interface WeatherMapProps {
  activeLayer: string; // 'temp', 'rain', 'wind', 'risk'
  searchCenter?: [number, number];
  activeLocation?: string;
  onMarkerClick?: (locationName: string) => void;
}

export default function WeatherMap({ 
  activeLayer, 
  searchCenter = [18.97, 74.5], 
  activeLocation = "Pune",
  onMarkerClick 
}: WeatherMapProps) {
  const [mapLocations, setMapLocations] = useState<MapLocationData[]>(INITIAL_LOCATIONS);

  // Fetch live weather data dynamically for map markers
  useEffect(() => {
    let isMounted = true;
    const fetchLiveMapData = async () => {
      try {
        // Ensure activeLocation is included in markers list if not already present
        let targetList = [...INITIAL_LOCATIONS];
        const exists = targetList.some(l => l.name.toLowerCase() === activeLocation.toLowerCase());
        
        if (!exists && activeLocation && searchCenter) {
          targetList.push({
            name: activeLocation,
            lat: searchCenter[0],
            lon: searchCenter[1],
            temp: "27°C",
            condition: "Live Weather",
            wind_speed: "14 km/h",
            rain_prob: "50%",
            risk: "LOW",
            color: "green",
            alert: "None"
          });
        }

        const updated = await Promise.all(
          targetList.map(async (loc) => {
            try {
              const res = await fetch(`${BACKEND_URL}/api/weather/current?location=${encodeURIComponent(loc.name)}`);
              if (res.ok) {
                const data = await res.json();
                const curr = data.weather?.current || {};
                const rData = data.risk || {};
                const coords = data.weather?.coordinates || {};
                const score = rData.score || 35;
                
                let col = "green";
                let rLvl = "LOW";
                if (score > 75) { col = "red"; rLvl = "SEVERE"; }
                else if (score > 50) { col = "orange"; rLvl = "HIGH"; }
                else if (score > 25) { col = "amber"; rLvl = "MODERATE"; }

                return {
                  ...loc,
                  lat: coords.lat || loc.lat,
                  lon: coords.lon || loc.lon,
                  temp: `${curr.temp ?? 27}°C`,
                  condition: curr.condition || loc.condition,
                  wind_speed: `${curr.wind_speed ?? 15} km/h`,
                  rain_prob: `${curr.rain_probability ?? 40}%`,
                  risk: rLvl,
                  color: col
                };
              }
            } catch {
              // fallback
            }
            return loc;
          })
        );
        if (isMounted) {
          setMapLocations(updated);
        }
      } catch {
        // use initial
      }
    };

    fetchLiveMapData();
    return () => { isMounted = false; };
  }, [activeLocation, searchCenter]);

  const getLayerTitle = () => {
    switch(activeLayer) {
      case 'rain': return '🌧️ Rainfall Forecast Layer';
      case 'wind': return '💨 Wind Speed Layer';
      case 'risk': return '⚠️ Warning & Risk Areas Layer';
      default: return '🌡️ Temperature Distribution Layer';
    }
  };

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Active Layer Badge Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 shadow-xl flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <span>{getLayerTitle()}</span>
      </div>

      <MapContainer 
        center={searchCenter} 
        zoom={8} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={searchCenter} />
        
        {/* Dark-inverted standard OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapLocations.map((loc) => {
          let label = `${loc.name}: ${loc.temp}`;
          const pinColor = loc.color;
          const isCurrentSelected = activeLocation.toLowerCase().includes(loc.name.toLowerCase()) || loc.name.toLowerCase().includes(activeLocation.toLowerCase());

          if (activeLayer === 'rain') {
            label = `${loc.name}: 🌧️ ${loc.rain_prob}`;
          } else if (activeLayer === 'wind') {
            label = `${loc.name}: 💨 ${loc.wind_speed}`;
          } else if (activeLayer === 'risk') {
            label = `${loc.name}: ⚠️ ${loc.risk.substring(0, 3)}`;
          }

          const icon = createCustomIcon(pinColor, label, isCurrentSelected);

          return (
            <Marker 
              key={`${loc.name}-${loc.lat}-${loc.lon}`} 
              position={[loc.lat, loc.lon]} 
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(loc.name);
                  }
                }
              }}
            >
              <Popup>
                <div className="text-slate-900 font-sans p-1">
                  <h3 className="font-bold text-base border-b pb-1 text-slate-800 flex items-center justify-between">
                    <span>{loc.name}</span>
                    {isCurrentSelected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Selected</span>
                    )}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-700">Live Temp:</span> {loc.temp}</p>
                    <p><span className="font-semibold text-slate-700">Condition:</span> {loc.condition}</p>
                    <p><span className="font-semibold text-slate-700">Rain Prob:</span> {loc.rain_prob}</p>
                    <p><span className="font-semibold text-slate-700">Wind Speed:</span> {loc.wind_speed}</p>
                    <p>
                      <span className="font-semibold text-slate-700">Risk Level:</span> 
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white
                        ${loc.risk === 'SEVERE' ? 'bg-red-500' : 
                          loc.risk === 'HIGH' ? 'bg-orange-500' : 
                          loc.risk === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'}
                      `}>
                        {loc.risk}
                      </span>
                    </p>
                    {loc.alert !== "None" && (
                      <p className="mt-1.5 text-xs text-red-600 bg-red-50 p-1 rounded font-semibold border border-red-200">
                        ⚠️ {loc.alert}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
