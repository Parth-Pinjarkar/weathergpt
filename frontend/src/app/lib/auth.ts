/**
 * WeatherGPT - Centralized Authentication & Token Management
 */

import { UserProfile, UserRole } from './types';

const TOKEN_KEY = 'weathergpt_token';
const USER_KEY = 'weathergpt_user';
const ROLE_KEY = 'weathergpt_mode';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage quota/permission issues
  }
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user.role) {
      localStorage.setItem(ROLE_KEY, user.role);
    }
  } catch {
    // Ignore
  }
}

export function removeStoredUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(ROLE_KEY, 'general');
  } catch {
    // Ignore
  }
}

export function getStoredRole(): UserRole {
  if (typeof window === 'undefined') return 'general';
  try {
    const role = localStorage.getItem(ROLE_KEY);
    if (role === 'farmer' || role === 'driver' || role === 'emergency' || role === 'admin' || role === 'operator') {
      return role;
    }
    return 'general';
  } catch {
    return 'general';
  }
}

export function setStoredRole(role: UserRole): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    // Ignore
  }
}

export function logout(): void {
  removeAuthToken();
  removeStoredUser();
}
