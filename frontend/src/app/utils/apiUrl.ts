/**
 * WeatherGPT Dynamic Backend API URL Resolver
 * 
 * Automatically resolves:
 * 1. NEXT_PUBLIC_API_URL if configured in environment
 * 2. If running on Render (e.g. weathergpt-frontend-*.onrender.com), dynamically routes to weathergpt-backend-*.onrender.com
 * 3. Default localhost:8000 for local development
 */
export function getBackendUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost:8000")) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    const host = window.location.host;
    const protocol = window.location.protocol;

    // If on render.com
    if (host.includes(".onrender.com")) {
      // If frontend is 'weathergpt-frontend-aglm.onrender.com', backend is 'weathergpt-backend-aglm.onrender.com'
      if (host.includes("frontend")) {
        const backendHost = host.replace("frontend", "backend");
        return `${protocol}//${backendHost}`;
      }
      return `${protocol}//weathergpt-backend.onrender.com`;
    }

    // If on Vercel
    if (host.includes("vercel.app")) {
      return "https://weathergpt-backend.onrender.com";
    }
  }

  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export const BACKEND_URL = getBackendUrl();
