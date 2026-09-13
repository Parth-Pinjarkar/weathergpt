// WeatherGPT Core Internationalization Engine
// Provides multi-lingual translations, formatters, and persistence for 10 languages

import { SupportedLanguage, UnitTemperature, UnitWind, UnitDistance } from './types';
import { DEFAULT_LANGUAGE, LANGUAGE_MAP } from './config';

// Import all 10 locale bundles
import enCommon from './locales/en/common.json';
import hiCommon from './locales/hi/common.json';
import mrCommon from './locales/mr/common.json';
import taCommon from './locales/ta/common.json';
import teCommon from './locales/te/common.json';
import bnCommon from './locales/bn/common.json';
import guCommon from './locales/gu/common.json';
import knCommon from './locales/kn/common.json';
import mlCommon from './locales/ml/common.json';
import paCommon from './locales/pa/common.json';

export * from './types';
export * from './config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LOCALES: Record<SupportedLanguage, any> = {
  en: enCommon,
  hi: hiCommon,
  mr: mrCommon,
  ta: taCommon,
  te: teCommon,
  bn: bnCommon,
  gu: guCommon,
  kn: knCommon,
  ml: mlCommon,
  pa: paCommon,
};

// Backward-compatible dictionary export
export const LOCALIZATION = LOCALES;

/**
 * Deep key lookup in a dictionary object (e.g. 'nav.dashboard')
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  if (!obj) return undefined;
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Translates a key for a given language with strict English fallback
 */
export function t(key: string, lang: SupportedLanguage = DEFAULT_LANGUAGE, fallback?: string): string {
  const currentLocale = LOCALES[lang] || LOCALES[DEFAULT_LANGUAGE];
  const englishLocale = LOCALES[DEFAULT_LANGUAGE];

  // 1. Direct path in selected language
  let val = getNestedValue(currentLocale as Record<string, unknown>, key) || (currentLocale as Record<string, unknown>)[key];
  if (val !== undefined && typeof val === 'string') return val;

  // 2. Fallback to English
  if (lang !== DEFAULT_LANGUAGE) {
    val = getNestedValue(englishLocale as Record<string, unknown>, key) || (englishLocale as Record<string, unknown>)[key];
    if (val !== undefined && typeof val === 'string') return val;
  }

  // 3. Explicit fallback or key name
  return fallback || key;
}

// ─────────────────────────────────────────────────────────────────────────────
// METEOROLOGICAL TRANSLATION HELPERS (10 LANGUAGES)
// ─────────────────────────────────────────────────────────────────────────────

const WEATHER_CONDITIONS: Record<string, Record<SupportedLanguage, string>> = {
  clear: {
    en: "Clear Sky",
    hi: "साफ आसमान",
    mr: "निरभ्र आकाश",
    ta: "தெளிவான வானம்",
    te: "నిర్మలమైన ఆకాశం",
    bn: "পরিষ্কার আকাশ",
    gu: "સ્વચ્છ આકાશ",
    kn: "ಸ್ವಚ್ಛ ಆಕಾಶ",
    ml: "തെളിഞ്ഞ ആകാശം",
    pa: "ਸਾਫ਼ ਅਸਮਾਨ"
  },
  sunny: {
    en: "Sunny",
    hi: "धूप",
    mr: "सूर्यप्रकाश",
    ta: "வெயில்",
    te: "ఎండగా ఉంది",
    bn: "রৌদ্রোজ্জ্বল",
    gu: "તડકો",
    kn: "ಬಿಸಿಲು",
    ml: "സൂര്യപ്രകാശം",
    pa: "ਧੁੱਪ"
  },
  partly_cloudy: {
    en: "Partly Cloudy",
    hi: "आंशिक रूप से बादल",
    mr: "अंशतः ढगाळ",
    ta: "பகுதி மேகமூட்டம்",
    te: "పాక్షికంగా మేఘావృతం",
    bn: "আংশিক মেঘলা",
    gu: "અંશતઃ વાદળછાયું",
    kn: "ಭಾಗಶಃ ಮೋಡ",
    ml: "ഭാഗികമായി മേഘാവൃതം",
    pa: "ਅੰਸ਼ਕ ਤੌਰ 'ਤੇ ਬੱਦਲਵਾਈ"
  },
  cloudy: {
    en: "Overcast Clouds",
    hi: "घने बादल",
    mr: "ढगाळ वातावरण",
    ta: "மேகமூட்டம்",
    te: "పూర్తిగా మేఘావృతం",
    bn: "মেঘলা আকাশ",
    gu: "વાદળછાયું",
    kn: "ಮೋಡ ಕವಿದ ವಾತಾವರಣ",
    ml: "മേഘാവൃതമായ ആകാശം",
    pa: "ਬੱਦਲਵਾਈ"
  },
  rain: {
    en: "Rain Showers",
    hi: "वर्षा / बारिश",
    mr: "पावसाच्या सरी",
    ta: "மழை",
    te: "వర్షం",
    bn: "বৃষ্টি",
    gu: "વરસાદ",
    kn: "ಮಳೆ",
    ml: "മഴ",
    pa: "ਮੀਂਹ"
  },
  heavy_rain: {
    en: "Heavy Rainfall",
    hi: "भारी बारिश",
    mr: "मुसळधार पाऊस",
    ta: "கனமழை",
    te: "భారీ వర్షం",
    bn: "ভারী বৃষ্টিপাত",
    gu: "ભારે વરસાદ",
    kn: "ಭಾರೀ ಮಳೆ",
    ml: "കനത്ത മഴ",
    pa: "ਭਾਰੀ ਮੀਂਹ"
  },
  thunderstorm: {
    en: "Thunderstorm",
    hi: "गरज के साथ तूफान",
    mr: "वादळी पाऊस / विजा",
    ta: "இடியுடன் கூடிய மழை",
    te: "ఉరుములతో కూడిన వర్షం",
    bn: "বজ্রবিদ্যুৎ সহ ঝড়",
    gu: "ગાજવીજ સાથે વાવાઝોડું",
    kn: "ಗುಡುಗು ಸಹಿತ ಬಿರುಗಾಳಿ",
    ml: "ഇടിമിന്നലോടു കൂടിയ മഴ",
    pa: "ਗਰਜ ਨਾਲ ਤੂਫ਼ਾਨ"
  },
  fog: {
    en: "Dense Fog",
    hi: "घना कोहरा",
    mr: "दाट धुके",
    ta: "அடர்ந்த பனிமூட்டம்",
    te: "దట్టమైన పొగమంచు",
    bn: "ঘন কুয়াশা",
    gu: "ગાઢ ધુમ્મસ",
    kn: "ದಟ್ಟ ಮಂಜು",
    ml: "കനത്ത മൂടൽമഞ്ഞ്",
    pa: "ਸੰਘਣੀ ਧੁੰਦ"
  },
  mist: {
    en: "Mist / Haze",
    hi: "धुंध / हल्का कोहरा",
    mr: "धुरकट वातावरण",
    ta: "லேசான பனி",
    te: "తేలికపాటి పొగమంచు",
    bn: "হালকা কুয়াশা",
    gu: "ઝાકળ",
    kn: "ತೆಳುವಾದ ಮಂಜು",
    ml: "നേർത്ത മൂടൽമഞ്ഞ്",
    pa: "ਧੁੰਦਲਕਾ"
  },
  windy: {
    en: "Windy / Gusts",
    hi: "तेज हवाएं",
    mr: "वादळी वारे",
    ta: "பலத்த காற்று",
    te: "తీవ్రమైన గాలులు",
    bn: "ঝোড়ো বাতাস",
    gu: "ઝડપી પવન",
    kn: "ಬಿರುಗಾಳಿ",
    ml: "ശക്തമായ കാറ്റ്",
    pa: "ਤੇਜ਼ ਹਵਾਵਾਂ"
  }
};

export function translateCondition(condition: string, lang: SupportedLanguage = DEFAULT_LANGUAGE): string {
  if (!condition) return "";
  const condKey = condition.toLowerCase().trim().replace(/[\s-]+/g, '_');
  
  if (WEATHER_CONDITIONS[condKey] && WEATHER_CONDITIONS[condKey][lang]) {
    return WEATHER_CONDITIONS[condKey][lang];
  }
  
  // Substring / fuzzy match
  for (const [key, mapping] of Object.entries(WEATHER_CONDITIONS)) {
    if (condKey.includes(key) && mapping[lang]) {
      return mapping[lang];
    }
  }

  return condition;
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK CATEGORY TRANSLATION (10 LANGUAGES)
// ─────────────────────────────────────────────────────────────────────────────

const RISK_CATEGORIES: Record<string, Record<SupportedLanguage, string>> = {
  LOW: {
    en: "Low Risk",
    hi: "कम जोखिम",
    mr: "कमी जोखीम",
    ta: "குறைந்த அபாயம்",
    te: "తక్కువ ప్రమాదం",
    bn: "কম ঝুঁকি",
    gu: "ઓછું જોખમ",
    kn: "ಕಡಿಮೆ ಅಪಾಯ",
    ml: "കുറഞ്ഞ അപകടസാധ്യത",
    pa: "ਘੱਟ ਖ਼ਤਰਾ"
  },
  MODERATE: {
    en: "Moderate Risk",
    hi: "मध्यम जोखिम",
    mr: "मध्यम जोखीम",
    ta: "மிதமான அபாயம்",
    te: "మితమైన ప్రమాదం",
    bn: "মাঝারি ঝুঁকি",
    gu: "મધ્યમ જોખમ",
    kn: "ಮಧ್ಯಮ ಅಪಾಯ",
    ml: "മിതമായ അപകടസാധ്യത",
    pa: "ਦਰਮਿਆਨਾ ਖ਼ਤਰਾ"
  },
  HIGH: {
    en: "High Risk",
    hi: "उच्च जोखिम",
    mr: "उच्च जोखीम",
    ta: "அதிக அபாயம்",
    te: "ఎక్కువ ప్రమాదం",
    bn: "উচ্চ ঝুঁকি",
    gu: "વધુ જોખમ",
    kn: "ಹೆಚ್ಚಿನ ಅಪಾಯ",
    ml: "ഉയർന്ന അപകടസാധ്യത",
    pa: "ਉੱਚ ਖ਼ਤਰਾ"
  },
  SEVERE: {
    en: "Severe Risk",
    hi: "गंभीर जोखिम",
    mr: "गंभीर जोखीम",
    ta: "தீவிர அபாயம்",
    te: "తీవ్రమైన ప్రమాదం",
    bn: "মারাত্মক ঝুঁকি",
    gu: "ગંભીર જોખમ",
    kn: "ತೀವ್ರ ಅಪಾಯ",
    ml: "ഗുരുതരമായ അപകടസാധ്യത",
    pa: "ਗੰਭੀਰ ਖ਼ਤਰਾ"
  }
};

export function translateRiskCategory(category: string, lang: SupportedLanguage = DEFAULT_LANGUAGE): string {
  if (!category) return "";
  const key = category.toUpperCase().trim();
  if (RISK_CATEGORIES[key] && RISK_CATEGORIES[key][lang]) {
    return RISK_CATEGORIES[key][lang];
  }
  return category;
}

// ─────────────────────────────────────────────────────────────────────────────
// DAY OF WEEK TRANSLATION (10 LANGUAGES)
// ─────────────────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK: Record<string, Record<SupportedLanguage, string>> = {
  Today: {
    en: "Today", hi: "आज", mr: "आज", ta: "இன்று", te: "ఈ రోజు",
    bn: "আজ", gu: "આજે", kn: "ಇಂದು", ml: "ഇന്ന്", pa: "ਅੱਜ"
  },
  Monday: {
    en: "Monday", hi: "सोमवार", mr: "सोमवार", ta: "திங்கள்", te: "సోమవారం",
    bn: "সোমবার", gu: "સોમવાર", kn: "ಸೋಮವಾರ", ml: "തിങ്കൾ", pa: "ਸੋਮਵਾਰ"
  },
  Tuesday: {
    en: "Tuesday", hi: "मंगलवार", mr: "मंगळवार", ta: "செவ்வாய்", te: "మంగళవారం",
    bn: "মঙ্গলবার", gu: "મંગળવાર", kn: "ಮಂಗಳವಾರ", ml: "ചൊവ്വ", pa: "ਮੰਗਲਵਾਰ"
  },
  Wednesday: {
    en: "Wednesday", hi: "बुधवार", mr: "बुधवार", ta: "புதன்", te: "బుధవారం",
    bn: "বুধবার", gu: "બુધવાર", kn: "ಬುಧವಾರ", ml: "ബുധൻ", pa: "ਬੁੱਧਵਾਰ"
  },
  Thursday: {
    en: "Thursday", hi: "गुरुवार", mr: "गुरूवार", ta: "வியாழன்", te: "గురువారం",
    bn: "বৃহস্পতিবার", gu: "ગુરુવાર", kn: "ಗುರುವಾರ", ml: "വ്യാഴം", pa: "ਵੀਰਵਾਰ"
  },
  Friday: {
    en: "Friday", hi: "शुक्रवार", mr: "शुक्रवार", ta: "வெள்ளி", te: "శుక్రవారం",
    bn: "শুক্রবার", gu: "શુક્રવાર", kn: "ಶುಕ್ರವಾರ", ml: "വെള്ളി", pa: "ਸ਼ੁੱਕਰਵਾਰ"
  },
  Saturday: {
    en: "Saturday", hi: "शनिवार", mr: "शनिवार", ta: "சனி", te: "శనివారం",
    bn: "শনিবার", gu: "શનિવાર", kn: "ಶನಿವಾರ", ml: "ശനി", pa: "ਸ਼ਨਿੱਚਰਵਾਰ"
  },
  Sunday: {
    en: "Sunday", hi: "रविवार", mr: "रविवार", ta: "ஞாயிறு", te: "ఆదివారం",
    bn: "রবিবার", gu: "રવિવાર", kn: "ಭಾನುವಾರ", ml: "ഞായർ", pa: "ਐਤਵਾਰ"
  }
};

export function translateDay(day: string, lang: SupportedLanguage = DEFAULT_LANGUAGE): string {
  if (!day) return "";
  const matchKey = Object.keys(DAYS_OF_WEEK).find(k => k.toLowerCase() === day.toLowerCase() || day.startsWith(k.substring(0, 3)));
  if (matchKey && DAYS_OF_WEEK[matchKey][lang]) {
    return DAYS_OF_WEEK[matchKey][lang];
  }
  return day;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION TRANSLATION (10 LANGUAGES)
// ─────────────────────────────────────────────────────────────────────────────

export function translateRecommendation(rec: string, lang: SupportedLanguage = DEFAULT_LANGUAGE): string {
  if (!rec) return "";
  if (lang === 'en') return rec;

  const recMap: Record<string, Record<SupportedLanguage, string>> = {
    safe: {
      en: "Safe outdoor conditions. Good day for outdoor activities.",
      hi: "बाहरी गतिविधियों के लिए सुरक्षित स्थिति। उत्तम दिन।",
      mr: "मैदानी कामांसाठी सुरक्षित परिस्थिती. उत्तम दिवस.",
      ta: "வெளிப்புற நடவடிக்கைகளுக்கு பாதுகாப்பான சூழல்.",
      te: "బయటి పనులకు అనుకూలమైన మరియు సురక్షితమైన వాతావరణం.",
      bn: "বাইরের কাজকর্মের জন্য নিরাপদ আবহাওয়া।",
      gu: "બહારના કામકાજ માટે અનુકૂળ અને સલામત હવામાન.",
      kn: "ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳಿಗೆ ಸುರಕ್ಷಿತ ವಾತಾವರಣ.",
      ml: "പുറത്തിറങ്ങിയുള്ള പ്രവർത്തനങ്ങൾക്ക് സുരക്ഷിതമായ അന്തരീക്ഷം.",
      pa: "ਬਾਹਰੀ ਕੰਮਾਂ ਲਈ ਸੁਰੱਖਿਅਤ ਮੌਸਮ।"
    },
    umbrella: {
      en: "Carry umbrella. Possible light showers.",
      hi: "छाता साथ रखें। हल्की बारिश संभव है।",
      mr: "छत्री सोबत ठेवा. हलक्या सरींची शक्यता.",
      ta: "குடை எடுத்துச் செல்லவும். லேசான மழை பெய்ய வாய்ப்புள்ளது.",
      te: "గొడుగు వెంట ఉంచుకోండి. తేలికపాటి జల్లులు కురిసే అవకాశం ఉంది.",
      bn: "সাথে ছাতা রাখুন। হালকা বৃষ্টির সম্ভাবনা রয়েছে।",
      gu: "છત્રી સાથે રાખો. હળવા વરસાદની શક્યતા છે.",
      kn: "ಛತ್ರಿ ಜೊತೆಗಿಟ್ಟುಕೊಳ್ಳಿ. ಸಾಧಾರಣ ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ.",
      ml: "കുട കയ്യിൽ കരുതുക. നേരിയ മഴയ്ക്ക് സാധ്യതയുണ്ട്.",
      pa: "ਛਤਰੀ ਨਾਲ ਰੱਖੋ। ਹਲਕੀ ਬਾਰਿਸ਼ ਹੋ ਸਕਦੀ ਹੈ।"
    },
    heavy: {
      en: "Heavy rainfall anticipated. Avoid unnecessary travel.",
      hi: "भारी बारिश की संभावना। अनावश्यक यात्रा से बचें।",
      mr: "मुसळधार पाऊस अपेक्षित. अनावश्यक प्रवास टाळा.",
      ta: "கனமழை எதிர்பார்க்கப்படுகிறது. தேவையற்ற பயணத்தைத் தவிர்க்கவும்.",
      te: "భారీ వర్షం పడే అవకాశం ఉంది. అనవసర ప్రయాణాలు వాయిదా వేసుకోండి.",
      bn: "ভারী বৃষ্টিপাতের সম্ভাবনা। অপ্রয়োজনীয় ভ্রমণ এড়িয়ে চলুন।",
      gu: "ભારે વરસાદની શક્યતા. બિનજરૂરી મુસાફરી ટાળો.",
      kn: "ಭಾರೀ ಮಳೆಯ ಮುನ್ಸೂಚನೆ. ಅನಗತ್ಯ ಪ್ರಯಾಣವನ್ನು ತಪ್ಪಿಸಿ.",
      ml: "കനത്ത മഴയ്ക്ക് സാധ്യത. അനാവശ്യ യാത്രകൾ ഒഴിവാക്കുക.",
      pa: "ਭਾਰੀ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ। ਬੇਲੋੜੀ ਯਾਤਰਾ ਤੋਂ ਬਚੋ।"
    },
    storm: {
      en: "Severe storm warning. Stay indoors.",
      hi: "गंभीर तूफान की चेतावनी। घर के अंदर सुरक्षित रहें।",
      mr: "गंभीर वादळाचा इशारा. घरामध्येच सुरक्षित राहा.",
      ta: "கடுமையான புயல் எச்சரிக்கை. வீட்டிற்குள்ளேயே பாதுகாப்பாக இருங்கள்.",
      te: "తీవ్రమైన తుఫాను హెచ్చరిక. ఇళ్లలోనే సురక్షితంగా ఉండండి.",
      bn: "মারাত্মক ঝড়ের সতর্কতা। ঘরের ভেতরে সুরক্ষিত থাকুন।",
      gu: "ગંભીર વાવાઝોડાની ચેતવણી. ઘરમાં જ સુરક્ષિત રહો.",
      kn: "ತೀವ್ರ ಬಿರುಗಾಳಿಯ ಎಚ್ಚರಿকে. ಮನೆಯಲ್ಲೇ ಸುರಕ್ಷಿತವಾಗಿರಿ.",
      ml: "തീവ്രമായ കൊടുങ്കാറ്റ് മുന്നറിയിപ്പ്. വീടുകളിൽ തന്നെ കഴിയുക.",
      pa: "ਗੰਭੀਰ ਤੂਫ਼ਾਨ ਦੀ ਚੇਤਾਵਨੀ। ਘਰਾਂ ਦੇ ਅੰਦਰ ਰਹੋ।"
    }
  };

  const lower = rec.toLowerCase();
  for (const [key, mapping] of Object.entries(recMap)) {
    if (lower.includes(key) || (key === 'safe' && lower.includes('safe')) || (key === 'umbrella' && lower.includes('umbrella')) || (key === 'heavy' && lower.includes('heavy')) || (key === 'storm' && lower.includes('storm'))) {
      if (mapping[lang]) return mapping[lang];
    }
  }

  return rec;
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK FACTOR TRANSLATION (10 LANGUAGES)
// ─────────────────────────────────────────────────────────────────────────────

export function translateRiskFactor(factor: string, lang: SupportedLanguage = DEFAULT_LANGUAGE): string {
  if (!factor || lang === 'en') return factor;

  const factorMap: Record<string, Record<SupportedLanguage, string>> = {
    precip: {
      en: "High Precipitation Probability",
      hi: "अत्यधिक वर्षा की संभावना",
      mr: "अतिवृष्टीची उच्च शक्यता",
      ta: "அதிக மழை பெய்யும் வாய்ப்பு",
      te: "అధిక వర్షపాత సంభావ్యత",
      bn: "অতিরিক্ত বৃষ্টির সম্ভাবনা",
      gu: "વધુ વરસાદની સંભાવના",
      kn: "ಹೆಚ್ಚಿನ ಮಳೆಯ ಸಾಧ್ಯತೆ",
      ml: "കനത്ത മഴ സാധ്യത",
      pa: "ਭਾਰੀ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ"
    },
    wind: {
      en: "High Wind Velocity",
      hi: "तेज हवा की गति",
      mr: "वादळी वार्याचा वेग",
      ta: "அதிவேக காற்று",
      te: "తీవ్రమైన గాలి వేగం",
      bn: "বাতাসের উচ্চ বেগ",
      gu: "ઝડપી પવનનો વેગ",
      kn: "ಹೆಚ್ಚಿನ ಗಾಳಿಯ ವೇಗ",
      ml: "ശക്തമായ കാറ്റിന്റെ വേഗത",
      pa: "ਤੇਜ਼ ਹਵਾ ਦੀ ਗਤੀ"
    },
    vis: {
      en: "Low Atmospheric Visibility",
      hi: "अत्यंत कम दृश्यता",
      mr: "अत्यंत कमी दृश्यमानता",
      ta: "குறைந்த பார்வைத் திறன்",
      te: "తక్కువ దృశ్యమానత",
      bn: "কম দৃশ্যমানতা",
      gu: "ઓછી દૃશ્યતા",
      kn: "ಕಡಿಮೆ ಗೋಚರತೆ",
      ml: "കുറഞ്ഞ കാഴ്ചാ പരിധി",
      pa: "ਘੱਟ ਦਿੱਖ"
    },
    heat: {
      en: "Extreme Heat Wave Condition",
      hi: "भीषण लू / अत्यधिक तापमान",
      mr: "तीव्र उष्णतेची लाट",
      ta: "கடும் வெப்ப அலை",
      te: "తీవ్రమైన వడగాల్పులు",
      bn: "তীব্র তাপপ্রবাহ",
      gu: "તીવ્ર હીટવેવ",
      kn: "ತೀವ್ರ ಶಾಖದ ಅಲೆ",
      ml: "കഠിനമായ ഉഷ്ണതരംഗം",
      pa: "ਭੀਸ਼ਣ ਲੂ ਦੀ ਸਥਿਤੀ"
    }
  };

  const lower = factor.toLowerCase();
  for (const [key, mapping] of Object.entries(factorMap)) {
    if (lower.includes(key) || (key === 'precip' && lower.includes('rain')) || (key === 'wind' && lower.includes('wind')) || (key === 'vis' && lower.includes('visibility')) || (key === 'heat' && lower.includes('heat'))) {
      if (mapping[lang]) return mapping[lang];
    }
  }

  return factor;
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIT FORMATTING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function formatTemperature(celsius: number, unit: UnitTemperature = 'celsius'): string {
  if (unit === 'fahrenheit') {
    const f = Math.round((celsius * 9) / 5 + 32);
    return `${f}°F`;
  }
  return `${celsius}°C`;
}

export function formatWindSpeed(kmh: number, unit: UnitWind = 'kmh'): string {
  if (unit === 'mph') {
    const mph = Math.round(kmh * 0.621371);
    return `${mph} mph`;
  }
  return `${kmh} km/h`;
}

export function formatDistance(km: number, unit: UnitDistance = 'km'): string {
  if (unit === 'miles') {
    const miles = Math.round(km * 0.621371 * 10) / 10;
    return `${miles} mi`;
  }
  return `${km} km`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCE ENGINE
// Priority: User DB -> LocalStorage -> Browser Locale -> English fallback
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'weathergpt_lang';

export function getSavedLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    // 1. Check localStorage
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
    if (saved && LANGUAGE_MAP[saved]) {
      return saved;
    }

    // 2. Check navigator.language
    const navLang = (navigator.language || '').slice(0, 2).toLowerCase() as SupportedLanguage;
    if (navLang && LANGUAGE_MAP[navLang]) {
      return navLang;
    }
  } catch (e) {
    console.warn("i18n: Failed reading local storage language", e);
  }

  return DEFAULT_LANGUAGE;
}

export function saveLanguagePreference(lang: SupportedLanguage, token?: string, backendUrl?: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = LANGUAGE_MAP[lang]?.dir || 'ltr';

    // Optional background sync with user profile if authenticated
    if (token && backendUrl) {
      fetch(`${backendUrl}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language: lang })
      }).catch(err => console.warn("Failed persisting language to user profile:", err));
    }
  } catch (e) {
    console.warn("i18n: Failed saving language preference", e);
  }
}
