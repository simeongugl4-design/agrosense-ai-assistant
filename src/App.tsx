import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CropAdvisor from "./pages/CropAdvisor";
import DiseaseScanner from "./pages/DiseaseScanner";
import AIAssistant from "./pages/AIAssistant";
import Weather from "./pages/Weather";
import Irrigation from "./pages/Irrigation";
import Fertilizer from "./pages/Fertilizer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/crops" element={<CropAdvisor />} />
          <Route path="/dashboard/disease" element={<DiseaseScanner />} />
          <Route path="/dashboard/assistant" element={<AIAssistant />} />
          <Route path="/dashboard/weather" element={<Weather />} />
          <Route path="/dashboard/irrigation" element={<Irrigation />} />
          <Route path="/dashboard/fertilizer" element={<Fertilizer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
