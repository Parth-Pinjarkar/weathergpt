'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Upload,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Send,
  Sparkles,
  Info,
  RefreshCw,
  Compass,
  Globe
} from 'lucide-react';

import { 
  getSavedLanguage, 
  saveLanguagePreference, 
  SupportedLanguage, 
  SUPPORTED_LANGUAGES,
  t 
} from '../i18n';
import { api } from '../lib/api';

interface PhotoAnalysisResult {
  analysis_id: string;
  image_metadata: {
    width: number;
    height: number;
    format: string;
    size_kb: number;
  };
  photo_observation: {
    weather_condition: string;
    precipitation_visible: boolean;
    cloud_condition: string;
    visibility_condition: string;
    road_condition: string;
    flooding_indicator: boolean;
    wind_effect_indicator: string;
    lightning_visible: boolean;
    fog_visible: boolean;
    haze_visible: boolean;
    environmental_hazards: string[];
    confidence: number;
    observations: string[];
    limitations: string[];
  };
  live_weather?: {
    location: string;
    current?: {
      temp: number;
      feels_like: number;
      condition: string;
      rain_probability: number;
      wind_speed: number;
      humidity: number;
      source: string;
    };
  };
  weather_consistency: {
    status: 'CONSISTENT' | 'PARTIALLY_CONSISTENT' | 'INCONSISTENT' | 'INSUFFICIENT_DATA';
    summary: string;
    agreements: string[];
    discrepancies: string[];
    confidence: number;
  };
  risk_assessment: {
    score: number;
    category: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
    color: string;
    base_weather_score: number;
    visual_factors: Array<{ factor: string; weight: number; icon: string }>;
    explanation: string;
  };
  hazards: string[];
  ai_explanation: string;
  recommendations: string[];
  confidence: number;
  mode: string;
  data_sources: string;
  scientific_disclaimer: string;
  analyzed_at: string;
}

export default function PhotoAnalysisPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState<string>('Nashik');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      return getSavedLanguage();
    }
    return 'en';
  });
  
  // Q&A State
  const [questionInput, setQuestionInput] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Selection
  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10 MB limit.');
      return;
    }
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalysisResult(null);
    setChatHistory([]);
  };

  // Demo Scenarios for SIH Judges
  const handleSelectDemoScenario = (scenarioFilename: string) => {
    setErrorMsg(null);
    // Create a mock image blob for demonstration
    const fakeBlob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])], { type: 'image/jpeg' });
    const mockFile = new File([fakeBlob], scenarioFilename, { type: 'image/jpeg' });
    setSelectedImage(mockFile);
    setPreviewUrl('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80');
    setAnalysisResult(null);
    setChatHistory([]);
  };

  // Execute Analysis
  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMsg('Please upload or capture a photo first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setLoadingStep('Uploading image & validating MIME headers...');

    try {
      setTimeout(() => setLoadingStep('Analyzing visible physical cues with Vision AI...'), 500);
      setTimeout(() => setLoadingStep('Retrieving live station telemetry & correlating...'), 1100);
      setTimeout(() => setLoadingStep('Synthesizing photo-enhanced risk score...'), 1600);

      const formData = new FormData();
      formData.append('file', selectedImage);
      if (locationInput.trim()) {
        formData.append('location', locationInput.trim());
      }
      formData.append('mode', 'demo');

      const data = await api.post<PhotoAnalysisResult>('/api/photo-analysis/analyze', formData);
      setAnalysisResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error occurred during photo weather analysis.';
      setErrorMsg(msg);
    } finally {
      setIsAnalyzing(false);
      setLoadingStep('');
    }
  };

  // Handle Contextual Question
  const handleAskQuestion = async (qText?: string) => {
    const q = qText || questionInput;
    if (!q.trim() || !analysisResult) return;

    setIsAsking(true);
    try {
      interface AskResponse {
        answer: string;
      }
      const data = await api.post<AskResponse>('/api/photo-analysis/ask', {
        analysis_id: analysisResult.analysis_id,
        question: q.trim(),
        lang: currentLang,
      });

      setChatHistory((prev) => [
        ...prev,
        { q: q.trim(), a: data.answer || 'No analysis available.' },
      ]);
      setQuestionInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve answer';
      setChatHistory((prev) => [
        ...prev,
        { q: q.trim(), a: `⚠️ ${msg}` },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased p-4 md:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition flex items-center gap-2 text-xs font-semibold text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {t('photo.title', currentLang, 'Photo Weather Intelligence')}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Multimodal AI
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {t('photo.subtitle', currentLang, 'Visual atmospheric observation correlated with verified meteorological station telemetry')}
              </p>
            </div>
          </div>
        </div>

        {/* Language Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-emerald-400" />
          <select
            value={currentLang}
            onChange={(e) => {
              const l = e.target.value as SupportedLanguage;
              setCurrentLang(l);
              saveLanguagePreference(l);
            }}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-5 space-y-5">
          {/* Upload Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-emerald-400" />
              Upload or Capture Photo
            </h2>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />

            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-200 transition"
              >
                <Upload className="h-4 w-4 text-emerald-400" />
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-200 transition"
              >
                <Camera className="h-4 w-4 text-cyan-400" />
                Take Photo
              </button>
            </div>

            {/* Preview Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition min-h-[190px] ${
                previewUrl ? 'border-emerald-500/50 bg-slate-950/60' : 'border-slate-800 hover:border-slate-700 bg-slate-950/30'
              }`}
            >
              {previewUrl ? (
                <div className="relative w-full text-center">
                  <img
                    src={previewUrl}
                    alt="Uploaded Weather"
                    className="max-h-48 mx-auto rounded-lg object-cover shadow-md border border-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    {selectedImage?.name || 'Photo Ready'} (Click to replace)
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="h-10 w-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-300">Drop an image here, or browse</p>
                  <p className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP up to 10 MB</p>
                </div>
              )}
            </div>

            {/* Location Input */}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Location Correlation (Optional)</span>
                <span className="text-[10px] text-slate-500">Links live station telemetry</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. Nashik, Mumbai, Pune, Delhi, Lonavala"
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setLocationInput('Nashik')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 rounded-xl border border-slate-700"
                >
                  Nashik
                </button>
                <button
                  type="button"
                  onClick={() => setLocationInput('')}
                  className="px-2.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-[11px] font-semibold text-slate-400 rounded-xl border border-slate-700"
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Analyze Button */}
            <button
              type="button"
              disabled={!selectedImage || isAnalyzing}
              onClick={handleAnalyze}
              className={`w-full mt-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                isAnalyzing || !selectedImage
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold shadow-emerald-500/20'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {loadingStep || 'Analyzing Weather Photo...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Weather from Photo
                </>
              )}
            </button>
          </div>

          {/* Quick SIH Demo Scenarios */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              SIH Judging Demo Scenarios (Zero Key Required)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '🌧️ Heavy Rain & Wet Road', file: 'heavy_rain_ponding.jpg' },
                { label: '⚡ Thunderstorm & Lightning', file: 'thunderstorm_squall.jpg' },
                { label: '🌫️ Dense Ghat Fog', file: 'dense_ghat_fog.jpg' },
                { label: '🌊 Road Inundation', file: 'flooded_expressway.jpg' },
                { label: '☀️ Clear Blue Sky', file: 'sunny_clear_sky.jpg' }
              ].map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectDemoScenario(s.file)}
                  className="p-2 text-left bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-xl text-[11px] font-medium text-slate-300 transition truncate"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Intelligence Output */}
        <div className="lg:col-span-7 space-y-5">
          {analysisResult ? (
            <>
              {/* Card 1: Key Findings & Consistency Badge */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                      Analyzed Condition
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 capitalize flex items-center gap-2">
                      {analysisResult.photo_observation.weather_condition.replace('_', ' ')}
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {analysisResult.confidence}% Visual Confidence
                      </span>
                    </h3>
                  </div>

                  {/* Consistency Badge */}
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                      Live Telemetry Agreement
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        analysisResult.weather_consistency.status === 'CONSISTENT'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : analysisResult.weather_consistency.status === 'PARTIALLY_CONSISTENT'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {analysisResult.weather_consistency.status === 'CONSISTENT' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {analysisResult.weather_consistency.status === 'PARTIALLY_CONSISTENT' && <AlertTriangle className="h-3.5 w-3.5" />}
                      {analysisResult.weather_consistency.status === 'INCONSISTENT' && <XCircle className="h-3.5 w-3.5" />}
                      {analysisResult.weather_consistency.status}
                    </span>
                  </div>
                </div>

                {/* Consistency Explanation */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  {analysisResult.weather_consistency.summary}
                </p>

                {/* Visual Observation Badges */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Cloud Deck</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {analysisResult.photo_observation.cloud_condition.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Road Pavement</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {analysisResult.photo_observation.road_condition.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Optical Visibility</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {analysisResult.photo_observation.visibility_condition.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Specific Visual Observations */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-slate-300 block">Visual Physical Cues:</span>
                  <ul className="space-y-1 text-xs text-slate-400">
                    {analysisResult.photo_observation.observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card 2: Photo-Enhanced Risk Gauge */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-slate-200">Photo-Enhanced Weather Risk</h4>
                  </div>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase border ${
                      analysisResult.risk_assessment.category === 'SEVERE'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : analysisResult.risk_assessment.category === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : analysisResult.risk_assessment.category === 'MODERATE'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {analysisResult.risk_assessment.category} ({analysisResult.risk_assessment.score}/100)
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {analysisResult.risk_assessment.explanation}
                </p>

                {/* Visual Risk Factors */}
                {analysisResult.risk_assessment.visual_factors.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400">Active Visual Threat Drivers:</span>
                    <div className="space-y-1.5">
                      {analysisResult.risk_assessment.visual_factors.map((vf, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                        >
                          <span className="text-slate-300">{vf.factor}</span>
                          <span className="text-amber-400 font-bold font-mono">+{vf.weight} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Actionable Safety Recommendations */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Actionable Operational Advisories
                </h4>
                <div className="space-y-2">
                  {analysisResult.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-slate-200 leading-relaxed"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Contextual Follow-Up Q&A */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    Ask WeatherGPT About This Photo
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Grounded Q&A</span>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5">
                  {['Is it safe to drive right now?', 'Should I go for an outdoor walk?', 'Will this rain continue?'].map((quickQ, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAskQuestion(quickQ)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 transition"
                    >
                      {quickQ}
                    </button>
                  ))}
                </div>

                {/* Q&A Thread */}
                {chatHistory.length > 0 && (
                  <div className="space-y-2.5 pt-2 max-h-60 overflow-y-auto pr-1">
                    {chatHistory.map((item, idx) => (
                      <div key={idx} className="space-y-1.5 text-xs">
                        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-slate-200 font-medium">
                          <span className="text-[10px] text-cyan-400 block font-bold">You asked:</span>
                          {item.q}
                        </div>
                        <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-200 leading-relaxed">
                          <span className="text-[10px] text-emerald-400 block font-bold">WeatherGPT Answer:</span>
                          {item.a}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                    placeholder="Ask about road conditions, outdoor safety, or gear..."
                    className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    disabled={isAsking || !questionInput.trim()}
                    onClick={() => handleAskQuestion()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Ask
                  </button>
                </div>
              </div>

              {/* Scientific Boundary Disclaimer */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-start gap-3 text-xs text-slate-400">
                <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-slate-300">Scientific Boundary Disclaimer: </strong>
                  {analysisResult.scientific_disclaimer}
                </p>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[420px] space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500">
                <Camera className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">No Photo Analyzed Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Select or capture a photo on the left, or test with one of the pre-configured SIH demo scenarios to see multimodal visual weather analysis in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
