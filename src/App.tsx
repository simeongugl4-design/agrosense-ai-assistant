import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CropAdvisor from "./pages/CropAdvisor";
import DiseaseScanner from "./pages/DiseaseScanner";
import AIAssistant from "./pages/AIAssistant";
import Weather from "./pages/Weather";
import Irrigation from "./pages/Irrigation";
import Fertilizer from "./pages/Fertilizer";
import FarmCalendar from "./pages/FarmCalendar";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import SoilAnalysis from "./pages/SoilAnalysis";
import NotFound from "./pages/NotFound";
import Hub from "./pages/Hub";
import Community from "./pages/Community";
import Cooperatives from "./pages/Cooperatives";
import SafetyChecker from "./pages/SafetyChecker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/crops" element={<CropAdvisor />} />
              <Route path="/dashboard/disease" element={<DiseaseScanner />} />
              <Route path="/dashboard/assistant" element={<AIAssistant />} />
              <Route path="/dashboard/weather" element={<Weather />} />
              <Route path="/dashboard/irrigation" element={<Irrigation />} />
              <Route path="/dashboard/fertilizer" element={<Fertilizer />} />
              <Route path="/dashboard/calendar" element={<FarmCalendar />} />
              <Route path="/dashboard/marketplace" element={<Marketplace />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/soil" element={<SoilAnalysis />} />
              <Route path="/dashboard/hub" element={<Hub />} />
              <Route path="/dashboard/community" element={<Community />} />
              <Route path="/dashboard/cooperatives" element={<Cooperatives />} />
              <Route path="/dashboard/safety" element={<SafetyChecker />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
