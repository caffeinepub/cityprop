import { Language, translations } from './translations';

const STORAGE_KEY = 'cityprop-language';

/**
 * Detects the browser/device language and returns a supported Language.
 * Handles locale variants by matching the primary subtag (e.g., "es-ES" -> "es").
 * Falls back to 'en' if the detected language is not supported.
 */
function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  // Check navigator.languages first (array of preferred languages)
  const languages = navigator.languages || [navigator.language];

  for (const lang of languages) {
    // Extract primary language subtag (e.g., "es-ES" -> "es", "fr-CA" -> "fr")
    const primaryLang = lang.split('-')[0].toLowerCase();

    // Check if it's a supported language
    if (primaryLang === 'en' || primaryLang === 'es' || primaryLang === 'fr') {
      return primaryLang as Language;
    }
  }

  // Fallback to English if no supported language is detected
  return 'en';
}

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  // First, check if there's a valid stored language preference
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === 'en' || stored === 'es' || stored === 'fr')) {
    return stored as Language;
  }

  // If no valid stored preference, detect browser language
  return detectBrowserLanguage();
}

export function setStoredLanguage(language: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, language);
}

export function translate(
  language: Language,
  key: string,
  params?: Record<string, string>
): string {
  const keys = key.split('.');
  let value: any = translations[language];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Handle interpolation
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }

  return value;
}
