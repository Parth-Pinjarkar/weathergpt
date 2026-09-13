import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";
import { ThemeProvider } from "./context/ThemeContext";

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

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('weathergpt_theme');
    var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.remove('dark-mode');
      root.classList.add('light-mode');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full font-body text-on-surface bg-background antialiased flex flex-col">
        <ThemeProvider>
          <ServiceWorkerRegistrar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
