/**
 * WeatherGPT - useChatSession Hook
 * Manages conversation history, AI API calls, session persistence, and metadata.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { ChatMessage, UserRole } from '../lib/types';
import { SupportedLanguage } from '../i18n';

const SESSION_KEY = 'weathergpt_chat_session';

interface UseChatSessionOptions {
  userRole?: UserRole;
  language?: SupportedLanguage;
  currentLocation?: string;
  onAssistantResponse?: (text: string) => void;
}

export function useChatSession({
  userRole = 'general',
  language = 'en',
  currentLocation = 'Nashik, Maharashtra',
  onAssistantResponse,
}: UseChatSessionOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 1,
      role: 'assistant',
      content: `Namaste! I am WeatherGPT, your intelligent IMD meteorological copilot. How can I assist you with real-time weather analytics, agriculture forecasts, or travel risk intelligence today?`,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SESSION_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const sendMessage = useCallback(
    async (queryText: string, customContext?: Record<string, unknown>) => {
      if (!queryText.trim()) return;

      const userMsg: ChatMessage = {
        id: Date.now(),
        role: 'user',
        content: queryText.trim(),
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      try {
        interface ChatResponse {
          answer_text: string;
          session_id?: string;
          alert_level?: string;
          advice?: string;
          weather_details?: unknown;
          risk_details?: unknown;
          route_details?: unknown;
        }

        const payload = {
          query: queryText.trim(),
          session_id: sessionId || undefined,
          role: userRole,
          lang: language,
          location: currentLocation,
          ...customContext,
        };

        const data = await api.post<ChatResponse>('/api/chat', payload);

        if (isMountedRef.current && data) {
          const assistantMsg: ChatMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: data.answer_text || 'Weather analysis complete.',
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: {
              alert_level: data.alert_level,
              advice: data.advice,
            },
          };

          setMessages((prev) => [...prev, assistantMsg]);

          if (data.session_id) {
            setSessionId(data.session_id);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(SESSION_KEY, data.session_id);
              } catch {
                // Ignore
              }
            }
          }

          if (onAssistantResponse && data.answer_text) {
            onAssistantResponse(data.answer_text);
          }
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const msg = err instanceof Error ? err.message : 'Failed to obtain AI response';
          setError(msg);

          const errorAssistantMsg: ChatMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: `I am currently having trouble connecting to the meteorological intelligence server (${msg}). Please try again in a moment.`,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, errorAssistantMsg]);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [sessionId, userRole, language, currentLocation, onAssistantResponse]
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: `Chat session reset. How can I assist you with your weather intelligence needs?`,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setSessionId(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        // Ignore
      }
    }
  }, []);

  return {
    messages,
    sessionId,
    loading,
    error,
    sendMessage,
    clearChat,
    setMessages,
  };
}
