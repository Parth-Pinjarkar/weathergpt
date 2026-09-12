// WeatherGPT i18n Configuration
import { LanguageInfo, SupportedLanguage } from './types';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    dir: 'ltr',
    speechLocale: 'en-IN'
  },
  {
    code: 'hi',
    name: 'हिन्दी',
    englishName: 'Hindi',
    dir: 'ltr',
    speechLocale: 'hi-IN'
  },
  {
    code: 'mr',
    name: 'मराठी',
    englishName: 'Marathi',
    dir: 'ltr',
    speechLocale: 'mr-IN'
  },
  {
    code: 'ta',
    name: 'தமிழ்',
    englishName: 'Tamil',
    dir: 'ltr',
    speechLocale: 'ta-IN'
  },
  {
    code: 'te',
    name: 'తెలుగు',
    englishName: 'Telugu',
    dir: 'ltr',
    speechLocale: 'te-IN'
  },
  {
    code: 'bn',
    name: 'বাংলা',
    englishName: 'Bengali',
    dir: 'ltr',
    speechLocale: 'bn-IN'
  },
  {
    code: 'gu',
    name: 'ગુજરાતી',
    englishName: 'Gujarati',
    dir: 'ltr',
    speechLocale: 'gu-IN'
  },
  {
    code: 'kn',
    name: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    dir: 'ltr',
    speechLocale: 'kn-IN'
  },
  {
    code: 'ml',
    name: 'മലയാളം',
    englishName: 'Malayalam',
    dir: 'ltr',
    speechLocale: 'ml-IN'
  },
  {
    code: 'pa',
    name: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    dir: 'ltr',
    speechLocale: 'pa-IN'
  }
];

export const LANGUAGE_MAP: Record<SupportedLanguage, LanguageInfo> = SUPPORTED_LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang.code] = lang;
    return acc;
  },
  {} as Record<SupportedLanguage, LanguageInfo>
);
