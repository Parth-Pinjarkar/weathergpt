// WeatherGPT Internationalization Types
// Supports 10 official languages with strict type safety

export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // हिन्दी (Hindi)
  | 'mr' // मराठी (Marathi)
  | 'ta' // தமிழ் (Tamil)
  | 'te' // తెలుగు (Telugu)
  | 'bn' // বাংলা (Bengali)
  | 'gu' // ગુજરાતી (Gujarati)
  | 'kn' // ಕನ್ನಡ (Kannada)
  | 'ml' // മലയാളം (Malayalam)
  | 'pa'; // ਪੰਜਾਬੀ (Punjabi)

export type Direction = 'ltr' | 'rtl';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string; // Native name (e.g. हिन्दी)
  englishName: string; // English name (e.g. Hindi)
  dir: Direction;
  speechLocale: string; // Browser Web Speech API locale (e.g. 'hi-IN')
}

export type UnitTemperature = 'celsius' | 'fahrenheit';
export type UnitWind = 'kmh' | 'mph';
export type UnitDistance = 'km' | 'miles';

export interface UserUnitsPreference {
  temperature: UnitTemperature;
  wind: UnitWind;
  distance: UnitDistance;
}

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}
