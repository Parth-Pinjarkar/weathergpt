"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Compass, X, Loader2, Sparkles, History, Building2, Mountain, Flame, Clock } from 'lucide-react';

export interface LocationItem {
  name: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
  type?: string;
  display_name?: string;
}

interface LocationSearchBarProps {
  currentLocation: string;
  onSelectLocation: (location: LocationItem) => void;
  onUseGps: () => void;
  isGpsLoading?: boolean;
}

const POPULAR_HUBS: LocationItem[] = [
  { name: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lon: 73.8567, type: "IT Hub" },
  { name: "Mumbai", state: "Maharashtra", country: "India", lat: 19.0760, lon: 72.8777, type: "Coastal Metro" },
  { name: "Delhi", state: "Delhi", country: "India", lat: 28.7041, lon: 77.1025, type: "Capital" },
  { name: "Nashik", state: "Maharashtra", country: "India", lat: 19.9975, lon: 73.7898, type: "Agri Hub" },
  { name: "Bengaluru", state: "Karnataka", country: "India", lat: 12.9716, lon: 77.5946, type: "Silicon Valley" },
  { name: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lon: 75.7873, type: "Heritage City" },
  { name: "Lonavala", state: "Maharashtra", country: "India", lat: 18.7557, lon: 73.4091, type: "Western Ghats" },
  { name: "Shimla", state: "Himachal Pradesh", country: "India", lat: 31.1048, lon: 77.1734, type: "Hill Station" },
  { name: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lon: 88.3639, type: "Metro" },
  { name: "Goa", state: "Goa", country: "India", lat: 15.2993, lon: 74.1240, type: "Coastal" },
  { name: "Varanasi", state: "Uttar Pradesh", country: "India", lat: 25.3176, lon: 82.9739, type: "Heritage" }
];

import { getBackendUrl } from '../utils/apiUrl';

export default function LocationSearchBar({
  currentLocation,
  onSelectLocation,
  onUseGps,
  isGpsLoading = false,
}: LocationSearchBarProps) {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<LocationItem[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('weathergpt_recent_searches');
        if (saved) {
          setRecentSearches(JSON.parse(saved).slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (item: LocationItem) => {
    if (typeof window === 'undefined') return;
    try {
      const filtered = recentSearches.filter(s => s.name.toLowerCase() !== item.name.toLowerCase());
      const updated = [item, ...filtered].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('weathergpt_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch location suggestions from backend API
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/location/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || (data.resolved ? [data.resolved] : []));
      } else {
        // Local fallback matching
        const localMatches = POPULAR_HUBS.filter(h => 
          h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.state?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSuggestions(localMatches);
      }
    } catch (err) {
      console.error("Location search error:", err);
      const localMatches = POPULAR_HUBS.filter(h => 
        h.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(localMatches);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 220);
  };

  const handleSelectItem = (item: LocationItem) => {
    saveRecentSearch(item);
    onSelectLocation(item);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const activeList = suggestions.length > 0 ? suggestions : (query ? [] : popularOrRecent);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < activeList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : activeList.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < activeList.length) {
        handleSelectItem(activeList[selectedIndex]);
      } else if (query.trim()) {
        // Submit raw query directly
        handleSelectItem({
          name: query.trim(),
          lat: 18.5204,
          lon: 73.8567,
          type: "Searched City"
        });
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const popularOrRecent = recentSearches.length > 0 ? recentSearches : POPULAR_HUBS.slice(0, 6);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl w-full">
      {/* Search Input Box */}
      <div className="relative flex items-center bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl transition-all duration-200 shadow-md">
        
        {/* Search Icon / Status */}
        <div className="pl-3.5 pr-2 text-slate-400">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          ) : (
            <Search className="h-4 w-4 text-emerald-400/90" />
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`Search any place (e.g. Pune, Jaipur, Delhi, Shimla)... [Current: ${currentLocation}]`}
          className="w-full bg-transparent py-2.5 pr-8 text-xs font-semibold text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearQuery}
            className="p-1 mr-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition"
            title="Clear Search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* GPS Location Button */}
        <button
          onClick={onUseGps}
          disabled={isGpsLoading}
          title="Detect Current GPS Location"
          className="flex items-center space-x-1 mr-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          {isGpsLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Compass className="h-3 w-3 animate-spin-slow" />
          )}
          <span className="hidden sm:inline">GPS</span>
        </button>
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Active Autocomplete Suggestions */}
          {suggestions.length > 0 ? (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> Matching Places ({suggestions.length})
                </span>
                <span className="text-slate-500 lowercase text-[9px]">press enter to select</span>
              </div>

              <div className="space-y-1 mt-1 max-h-72 overflow-y-auto custom-scrollbar">
                {suggestions.map((item, index) => {
                  const isSelected = selectedIndex === index;
                  return (
                    <button
                      key={`${item.name}-${item.lat}-${index}`}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' 
                          : 'text-slate-200 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 group-hover:bg-emerald-500 group-hover:text-white transition">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.state ? `${item.state}, ` : ''}{item.country || 'India'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        {item.type && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {item.type}
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                          {item.lat.toFixed(2)}°N, {item.lon.toFixed(2)}°E
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : query.trim() ? (
            /* No direct results, offer to search custom query */
            <div className="p-4 text-center">
              <p className="text-xs text-slate-300 mb-2">No predefined match for &quot;{query}&quot;</p>
              <button
                onClick={() => handleSelectItem({
                  name: query.trim(),
                  lat: 18.5204,
                  lon: 73.8567,
                  type: "Live Geocoded Location"
                })}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md"
              >
                Fetch Live Weather for &quot;{query.trim()}&quot; →
              </button>
            </div>
          ) : (
            /* Default view: Recent Searches + Popular Indian Cities */
            <div className="p-3 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <History className="h-3 w-3 text-cyan-400" /> Recent Places
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {recentSearches.map((item, idx) => (
                      <button
                        key={`recent-${item.name}-${idx}`}
                        onClick={() => handleSelectItem(item)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition group"
                      >
                        <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-300">
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Hubs */}
              <div>
                <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-amber-400" /> Popular Indian Hubs
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
                  {POPULAR_HUBS.map((item) => (
                    <button
                      key={`hub-${item.name}`}
                      onClick={() => handleSelectItem(item)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-left transition group"
                    >
                      <div className="truncate mr-1">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.state}
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400/90 font-semibold shrink-0">
                        {item.type?.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
