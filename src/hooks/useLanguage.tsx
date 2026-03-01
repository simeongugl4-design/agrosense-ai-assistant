import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { COUNTRY_LANGUAGES, type CountryLanguage } from "@/lib/language-data";

interface LanguageContextType {
  selectedCountry: string;
  selectedLanguage: string;
  countryData: CountryLanguage | null;
  setCountryAndLanguage: (country: string, language: string) => void;
  isLanguageSet: boolean;
  allCountries: CountryLanguage[];
}

const LanguageContext = createContext<LanguageContextType>({
  selectedCountry: "",
  selectedLanguage: "English",
  countryData: null,
  setCountryAndLanguage: () => {},
  isLanguageSet: false,
  allCountries: COUNTRY_LANGUAGES,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  useEffect(() => {
    const saved = localStorage.getItem("agrosense_language");
    if (saved) {
      try {
        const { country, language } = JSON.parse(saved);
        setSelectedCountry(country);
        setSelectedLanguage(language);
      } catch {}
    }
  }, []);

  const countryData = COUNTRY_LANGUAGES.find(c => c.country === selectedCountry) || null;
  const isLanguageSet = !!selectedCountry && !!selectedLanguage;

  const setCountryAndLanguage = (country: string, language: string) => {
    setSelectedCountry(country);
    setSelectedLanguage(language);
    localStorage.setItem("agrosense_language", JSON.stringify({ country, language }));
  };

  return (
    <LanguageContext.Provider value={{
      selectedCountry,
      selectedLanguage,
      countryData,
      setCountryAndLanguage,
      isLanguageSet,
      allCountries: COUNTRY_LANGUAGES,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
