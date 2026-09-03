"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ── Service Worker Registration ───────────────────────────────────────────────
function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[WeatherGPT] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[WeatherGPT] Service Worker registration failed:", err);
        });
    }
  }, []);
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* ── Favicon & Icons ────────────────────────────────────────────── */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f326.png" />

        {/* ── PWA ───────────────────────────────────────────────────────── */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="WeatherGPT" />

        {/* ── Theme & Viewport ─────────────────────────────────────────── */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="dark" />

        {/* ── SEO ──────────────────────────────────────────────────────── */}
        <title>WeatherGPT — AI Weather &amp; Disaster Copilot</title>
        <meta
          name="description"
          content="AI-powered multilingual weather intelligence and disaster preparedness platform for India. Get live weather, risk scores, route safety, and disaster alerts."
        />
        <meta name="keywords" content="weather, AI, India, disaster, forecast, IMD, rainfall, WeatherGPT" />
        <meta name="author" content="WeatherGPT Team" />

        {/* ── Open Graph ───────────────────────────────────────────────── */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="WeatherGPT — AI Weather & Disaster Copilot" />
        <meta
          property="og:description"
          content="Understand the weather. Predict the risk. Take the right action."
        />
        <meta property="og:image" content="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/512x512/1f326.png" />
      </head>
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
