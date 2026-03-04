import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import {
  Cloud, Sun, CloudRain, Droplets, Wind, Thermometer,
  AlertTriangle, Calendar, Sprout, Loader2, Search,
  CloudSnow, CloudLightning, CloudFog, MapPin, Navigation, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWeatherData } from "@/lib/ai-service";
import type { WeatherData } from "@/lib/ai-service";
import { toast } from "@/hooks/use-toast";

interface LocationSuggestion {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  addresstype?: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
    region?: string;
    country?: string;
  };
}

function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return Sun;
  if (code === 2 || code === 3) return Cloud;
  if (code >= 45 && code <= 48) return CloudFog;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

const formatSuggestion = (suggestion: LocationSuggestion) => {
  const address = suggestion.address || {};
  const title = suggestion.name || address.village || address.town || address.city || address.county || address.state || suggestion.display_name.split(",")[0];
  const subtitleParts = [address.county, address.state, address.region, address.country]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .filter((value) => value !== title);

  return {
    title,
    subtitle: subtitleParts.join(", ") || suggestion.addresstype || suggestion.type || suggestion.display_name,
  };
};

export default function Weather() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("agrosense_recent_weather") || "[]");
    } catch {
      return [];
    }
  });

  const addRecentSearch = (loc: string) => {
    const updated = [loc, ...recentSearches.filter((search) => search !== loc)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem("agrosense_recent_weather", JSON.stringify(updated));
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (searchTimeout) clearTimeout(searchTimeout);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&q=${encodeURIComponent(value.trim())}`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        );

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    const nextLocation = suggestion.display_name;
    setLocation(nextLocation);
    setShowSuggestions(false);
    setSuggestions([]);
    void handleSearchWithLocation(nextLocation);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation not supported" });
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locStr = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        setLocation(locStr);
        setIsLoading(true);

        try {
          const data = await getWeatherData(locStr);
          setWeather(data);
          addRecentSearch(data.location || locStr);
        } catch {
          toast({ variant: "destructive", title: "Failed to get weather for your location" });
        } finally {
          setGeoLoading(false);
          setIsLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        toast({
          variant: "destructive",
          title: "Location access denied",
          description: "Please enable location access or search manually",
        });
      },
    );
  };

  const handleSearchWithLocation = async (loc: string) => {
    if (!loc.trim()) {
      toast({ variant: "destructive", title: "Please enter a location" });
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const data = await getWeatherData(loc.trim());
      setWeather(data);
      setLocation(data.location || loc.trim());
      addRecentSearch(data.location || loc.trim());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Weather Fetch Failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => void handleSearchWithLocation(location);

  const getOSMMapUrl = () => {
    if (!weather?.coordinates) return null;
    const { latitude, longitude } = weather.coordinates;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.05},${latitude - 0.05},${longitude + 0.05},${latitude + 0.05}&layer=mapnik&marker=${latitude},${longitude}`;
  };


  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header 
          title="Weather Intelligence" 
          subtitle="Real-time weather for any village, town or city worldwide" 
        />
        
        <main className="p-4 lg:p-6">
          {/* Search Bar with autocomplete */}
          <div className="flex gap-3 mb-6 lg:mb-8 relative">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search any place — village, town, city (e.g., Kibera, Nairobi)"
                className="pl-10"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion) => {
                    const formatted = formatSuggestion(suggestion);

                    return (
                      <button
                        key={suggestion.place_id}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 flex items-center gap-3 transition-colors border-b border-border/50 last:border-0"
                        onMouseDown={() => selectSuggestion(suggestion)}
                      >
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{formatted.title}</p>
                          <p className="text-xs text-muted-foreground">{formatted.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Globe className="w-4 h-4 mr-2" />Get Weather</>}
            </Button>
            <Button variant="outline" onClick={handleGetCurrentLocation} disabled={geoLoading}>
              {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Navigation className="w-4 h-4 mr-1" />My Location</>}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-foreground font-medium">Fetching live weather data...</p>
              <p className="text-sm text-muted-foreground">Generating AI farming insights</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !weather && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Cloud className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-foreground font-medium mb-2">Search any location worldwide</p>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Get real-time weather for any village, town, or city. Type to search — our system covers every corner of the earth.
              </p>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-6 w-full max-w-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" /> Recent Searches
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {recentSearches.map(place => (
                      <button
                        key={place}
                        onClick={() => { setLocation(place); handleSearchWithLocation(place); }}
                        className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-foreground hover:bg-primary/20 transition-all"
                      >
                        🕐 {place}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center">
                {["Kibera, Kenya", "Ludhiana, India", "Kumasi, Ghana", "São Paulo, Brazil", "Iowa, USA"].map(place => (
                  <button
                    key={place}
                    onClick={() => { setLocation(place); handleSearchWithLocation(place); }}
                    className="px-3 py-1.5 bg-card border border-border rounded-full text-xs text-foreground hover:border-primary/50 transition-all"
                  >
                    📍 {place}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weather Data */}
          {!isLoading && weather && (
            <>
              {/* Current Weather + Map */}
              <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
                <div className="lg:col-span-1 bg-gradient-to-br from-accent to-accent/80 rounded-xl p-5 lg:p-6 text-accent-foreground">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm opacity-80">Current Weather</p>
                      <p className="text-xs opacity-60">{weather.location}</p>
                    </div>
                    {(() => {
                      const Icon = getWeatherIcon(weather.current.weatherCode);
                      return <Icon className="w-8 h-8" />;
                    })()}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    {(() => {
                      const Icon = getWeatherIcon(weather.current.weatherCode);
                      return <Icon className="w-16 h-16 lg:w-20 lg:h-20" />;
                    })()}
                    <div>
                      <p className="text-4xl lg:text-5xl font-bold">{weather.current.temp}°C</p>
                      <p className="opacity-80">{weather.current.condition}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <Droplets className="w-5 h-5 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.humidity}%</p>
                      <p className="text-xs opacity-60">Humidity</p>
                    </div>
                    <div className="text-center">
                      <Wind className="w-5 h-5 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.windSpeed} km/h</p>
                      <p className="text-xs opacity-60">Wind</p>
                    </div>
                    <div className="text-center">
                      <Thermometer className="w-5 h-5 mx-auto mb-1 opacity-80" />
                      <p className="text-sm font-medium">{weather.current.feelsLike}°C</p>
                      <p className="text-xs opacity-60">Feels Like</p>
                    </div>
                  </div>
                </div>

                {/* Map + Alerts */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Interactive Map */}
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-3 border-b border-border flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Farm Location Map</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {weather.coordinates.latitude.toFixed(4)}°, {weather.coordinates.longitude.toFixed(4)}°
                      </span>
                    </div>
                    <iframe
                      src={getOSMMapUrl() || ""}
                      className="w-full h-48 lg:h-56"
                      style={{ border: 0 }}
                      loading="lazy"
                      title="Farm location map"
                    />
                  </div>

                  {/* Farming Alerts */}
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      AI Farming Alerts
                    </h3>
                    <div className="space-y-2">
                      {weather.farmingAlerts.length > 0 ? (
                        weather.farmingAlerts.map((alert, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              alert.type === "warning"
                                ? "bg-warning/10 border-warning/30"
                                : alert.type === "success"
                                ? "bg-success/10 border-success/30"
                                : "bg-accent/10 border-accent/30"
                            }`}
                          >
                            <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No specific alerts for your area today.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 7-Day Forecast */}
              <div className="bg-card rounded-xl border border-border p-5 lg:p-6 mb-6 lg:mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  7-Day Forecast
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 lg:gap-4">
                  {weather.forecast.map((day, index) => {
                    const DayIcon = getWeatherIcon(day.weatherCode);
                    return (
                      <div
                        key={index}
                        className={`text-center p-3 lg:p-4 rounded-xl transition-all ${
                          index === 0
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <p className={`text-xs lg:text-sm font-medium mb-2 ${index === 0 ? "text-primary" : "text-foreground"}`}>
                          {day.day}
                        </p>
                        <DayIcon className={`w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 ${
                          day.condition.includes("Rain") || day.condition.includes("Drizzle") ? "text-accent" : "text-secondary"
                        }`} />
                        <p className="text-base lg:text-lg font-bold text-foreground">{day.high}°</p>
                        <p className="text-xs lg:text-sm text-muted-foreground">{day.low}°</p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <Droplets className="w-3 h-3 text-accent" />
                          <span className="text-xs text-muted-foreground">{day.rainChance}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Farming Tips */}
              {weather.farmingTips.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-5 lg:p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-success" />
                    Smart Farming Recommendations
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    {weather.farmingTips.map((tip, index) => (
                      <div
                        key={index}
                        className={`p-3 lg:p-4 rounded-xl border ${
                          tip.status === "urgent"
                            ? "bg-warning/10 border-warning/30"
                            : tip.status === "pause"
                            ? "bg-muted border-border"
                            : tip.status === "good"
                            ? "bg-success/10 border-success/30"
                            : "bg-accent/10 border-accent/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground text-sm">{tip.activity}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            tip.status === "urgent"
                              ? "bg-warning text-warning-foreground"
                              : tip.status === "pause"
                              ? "bg-muted-foreground/20 text-muted-foreground"
                              : tip.status === "good"
                              ? "bg-success text-success-foreground"
                              : "bg-accent text-accent-foreground"
                          }`}>
                            {tip.status === "urgent" ? "Do Now" : tip.status === "pause" ? "Skip" : tip.status === "good" ? "Good" : "Wait"}
                          </span>
                        </div>
                        <p className="text-xs lg:text-sm text-muted-foreground">{tip.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}