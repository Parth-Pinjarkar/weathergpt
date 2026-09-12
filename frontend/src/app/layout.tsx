import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#006948",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "WeatherGPT — AI Weather & Disaster Copilot (MoES / IMD)",
  description: "AI-powered multilingual weather intelligence and disaster preparedness platform for India. Live synoptic telemetry, NWP consensus, and risk predictions.",
  keywords: ["weather", "AI", "India", "disaster", "forecast", "IMD", "MoES", "rainfall", "WeatherGPT"],
  authors: [{ name: "WeatherGPT Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f326.png",
  },
  openGraph: {
    type: "website",
    title: "WeatherGPT — AI Weather & Disaster Copilot",
    description: "Understand the weather. Predict the risk. Take the right action.",
    images: ["https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/512x512/1f326.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full font-body text-on-surface bg-background antialiased flex flex-col">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}

