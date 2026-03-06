import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { DASHBOARD_COPY_EN, type DashboardCopy } from "@/lib/dashboard-copy";

const CACHE_PREFIX = "agrosense_dashboard_copy_v2";

const isDashboardCopy = (value: unknown): value is DashboardCopy => {
  return Boolean(value && typeof value === "object" && "common" in (value as Record<string, unknown>) && "dashboard" in (value as Record<string, unknown>));
};

// Offline-first: store in both localStorage and Cache API for service worker access
const persistTranslationCache = async (language: string, data: DashboardCopy) => {
  const cacheKey = `${CACHE_PREFIX}:${language}`;
  localStorage.setItem(cacheKey, JSON.stringify(data));

  // Also store in Cache API for offline service worker access
  if ("caches" in window) {
    try {
      const cache = await caches.open("agrosense-translations-v1");
      const response = new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
      await cache.put(`/translations/${language}`, response);
    } catch {
      // Cache API not available - localStorage fallback is fine
    }
  }
};

const loadCachedTranslation = async (language: string): Promise<DashboardCopy | null> => {
  const cacheKey = `${CACHE_PREFIX}:${language}`;

  // Try localStorage first (fastest)
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (isDashboardCopy(parsed)) return parsed;
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  // Fallback to Cache API (works offline with service worker)
  if ("caches" in window) {
    try {
      const cache = await caches.open("agrosense-translations-v1");
      const response = await cache.match(`/translations/${language}`);
      if (response) {
        const data = await response.json();
        if (isDashboardCopy(data)) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          return data;
        }
      }
    } catch {
      // Cache API not available
    }
  }

  return null;
};

export const formatDashboardText = (
  template: string,
  values: Record<string, string | number | undefined>,
) => {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.split(`{${key}}`).join(String(value ?? ""));
  }, template);
};

export function useDashboardTranslations() {
  const { selectedLanguage, selectedCountry } = useLanguage();
  const language = selectedLanguage?.trim() || "English";
  const country = selectedCountry?.trim() || "";
  const [copy, setCopy] = useState<DashboardCopy>(DASHBOARD_COPY_EN);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadTranslations = async () => {
      if (language === "English") {
        setCopy(DASHBOARD_COPY_EN);
        setIsTranslating(false);
        return;
      }

      // Offline-first: load from dual cache (localStorage + Cache API)
      const cachedCopy = await loadCachedTranslation(language);
      if (cachedCopy) {
        setCopy(cachedCopy);
      } else {
        setCopy(DASHBOARD_COPY_EN);
      }

      // Try to fetch fresh translations (skip if offline)
      if (!navigator.onLine) {
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);

      try {
        const { data, error } = await supabase.functions.invoke("ui-translations", {
          body: {
            language,
            country,
            payload: DASHBOARD_COPY_EN,
          },
        });

        if (!isCancelled) {
          if (!error && data?.translations && isDashboardCopy(data.translations)) {
            setCopy(data.translations);
            void persistTranslationCache(language, data.translations);
          }
          setIsTranslating(false);
        }
      } catch {
        // Network error - use cached version (already set above)
        if (!isCancelled) setIsTranslating(false);
      }
    };

    void loadTranslations();

    return () => {
      isCancelled = true;
    };
  }, [country, language]);

  return {
    copy,
    country,
    language,
    isTranslating,
    format: formatDashboardText,
  };
}
