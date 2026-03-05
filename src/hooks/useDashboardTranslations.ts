import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { DASHBOARD_COPY_EN, type DashboardCopy } from "@/lib/dashboard-copy";

const CACHE_PREFIX = "agrosense_dashboard_copy_v1";

const isDashboardCopy = (value: unknown): value is DashboardCopy => {
  return Boolean(value && typeof value === "object" && "common" in (value as Record<string, unknown>) && "dashboard" in (value as Record<string, unknown>));
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

      const cacheKey = `${CACHE_PREFIX}:${language}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (isDashboardCopy(parsed)) {
            setCopy(parsed);
          }
        } catch {
          localStorage.removeItem(cacheKey);
        }
      } else {
        setCopy(DASHBOARD_COPY_EN);
      }

      setIsTranslating(true);

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
          localStorage.setItem(cacheKey, JSON.stringify(data.translations));
        }
        setIsTranslating(false);
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
