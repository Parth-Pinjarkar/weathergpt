/**
 * WeatherGPT - ChatDrawer Component
 * Interactive slide-over AI Meteorological Copilot Drawer with speech narration.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Volume2,
  VolumeX,
  RefreshCw,
  X,
  Sparkles,
  Bot,
  User,
  Trash2,
} from 'lucide-react';
import { ChatMessage, UserRole } from '../../lib/types';
import { SupportedLanguage } from '../../i18n';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  loading: boolean;
  currentLocation: string;
  currentRole: UserRole;
  currentLang: SupportedLanguage;
  onSendMessage: (query: string) => void;
  onClearChat: () => void;
  isListening?: boolean;
  isSpeaking?: boolean;
  onStartListening?: () => void;
  onStopListening?: () => void;
  onSpeakText?: (text: string) => void;
  onStopSpeaking?: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  loading,
  currentLocation,
  currentRole,
  currentLang,
  onSendMessage,
  onClearChat,
  isListening,
  isSpeaking,
  onStartListening,
  onStopListening,
  onSpeakText,
  onStopSpeaking,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !loading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const suggestions = [
    `Will it rain in ${currentLocation} today?`,
    'Is it safe to spray crops this afternoon?',
    'What is the 3-day temperature trend?',
    'Are there any active flood or cyclone alerts?',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between border-l border-surface-container-high relative animate-slide-left">
        {/* Drawer Header */}
        <div className="p-space-md bg-surface-glass backdrop-blur-md border-b border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <div className="w-9 h-9 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-on-surface">WeatherGPT AI Copilot</h2>
                <span className="w-2 h-2 rounded-full bg-radar-emerald animate-pulse"></span>
              </div>
              <p className="text-[10px] font-mono text-outline uppercase">
                {currentLocation} • {currentRole.toUpperCase()} • {currentLang.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClearChat}
              title="Reset Chat History"
              className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Assistant"
              className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-3">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    isUser
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-primary border border-surface-container-high'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>

                <div className="flex flex-col">
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface-container-low text-on-surface border border-surface-container-high rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Speech Narration Button */}
                    {!isUser && onSpeakText && (
                      <div className="mt-2 pt-1 border-t border-surface-container-high flex items-center justify-between">
                        <span className="font-mono text-[9px] text-outline">{msg.created_at}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (isSpeaking && onStopSpeaking) {
                              onStopSpeaking();
                            } else {
                              onSpeakText(msg.content);
                            }
                          }}
                          className="flex items-center gap-1 text-[10px] font-mono text-primary hover:underline cursor-pointer"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="h-3 w-3" />
                              <span>Mute</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3 w-3" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 mr-auto max-w-[80%]">
              <div className="w-7 h-7 rounded-full bg-surface-container-low text-primary border border-surface-container-high flex items-center justify-center shrink-0">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low text-on-surface-variant text-xs border border-surface-container-high rounded-tl-none">
                WeatherGPT is interpolating synoptic models...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Suggestions */}
        <div className="p-space-sm md:p-space-md bg-surface-container-lowest border-t border-surface-container-high flex flex-col gap-2">
          {/* Quick Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSendMessage(s)}
                className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-mono-sm text-[10px] border border-surface-container-high whitespace-nowrap transition cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about weather, crops, routes..."
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-xs pl-3.5 pr-20 py-2.5 rounded-lg border border-surface-container-high focus:outline-none focus:border-primary transition"
            />

            <div className="absolute right-1.5 flex items-center gap-1">
              {onStartListening && (
                <button
                  type="button"
                  onClick={isListening ? onStopListening : onStartListening}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'hover:bg-surface-container text-outline hover:text-on-surface'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Voice Query'}
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-1.5 rounded-md bg-primary hover:bg-primary-container text-on-primary transition cursor-pointer disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatDrawer;
