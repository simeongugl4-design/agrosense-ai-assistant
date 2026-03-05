import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslations";
import { Globe, Check, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LanguageSelector() {
  const { selectedCountry, selectedLanguage, setCountryAndLanguage, allCountries } = useLanguage();
  const { copy, format } = useDashboardTranslations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tempCountry, setTempCountry] = useState("");
  const [tempLanguage, setTempLanguage] = useState("");

  const filtered = useMemo(() => {
    if (!search) return allCountries;
    const q = search.toLowerCase();
    return allCountries.filter((c) =>
      c.country.toLowerCase().includes(q) || c.languages.some((l) => l.toLowerCase().includes(q)),
    );
  }, [search, allCountries]);

  const selectedCountryData = allCountries.find((c) => c.country === tempCountry);

  const handleConfirm = () => {
    if (tempCountry && tempLanguage) {
      setCountryAndLanguage(tempCountry, tempLanguage);
      setOpen(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setTempCountry(selectedCountry);
          setTempLanguage(selectedLanguage);
          setSearch("");
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors text-sm">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-foreground font-medium">
            {selectedCountry ? `${selectedCountry} — ${selectedLanguage}` : copy.languageSelector.button}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {copy.languageSelector.title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={copy.languageSelector.searchPlaceholder}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p className="text-xs font-medium text-muted-foreground mb-1">{copy.languageSelector.stepCountry}</p>
        <ScrollArea className="h-48 border border-border rounded-lg mb-3">
          <div className="p-1">
            {filtered.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setTempCountry(c.country);
                  setTempLanguage(c.languages[0]);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                  tempCountry === c.country ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                }`}
              >
                <span>{c.country}</span>
                {tempCountry === c.country && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </ScrollArea>

        {selectedCountryData && selectedCountryData.languages.length > 0 && (
          <>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {format(copy.languageSelector.stepLanguage, { country: tempCountry })}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCountryData.languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTempLanguage(lang)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    tempLanguage === lang
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </>
        )}

        {tempCountry && tempLanguage && (
          <div className="bg-success/10 border border-success/30 rounded-lg p-3 mb-3">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{copy.languageSelector.selectedLabel}</span> {tempCountry} — {tempLanguage}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(copy.languageSelector.summary, { language: tempLanguage })}
            </p>
          </div>
        )}

        <Button onClick={handleConfirm} disabled={!tempCountry || !tempLanguage} className="w-full">
          {copy.languageSelector.confirm}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
