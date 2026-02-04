import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-farm.jpg";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Smart Agriculture"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 floating-animation opacity-20">
        <Leaf className="w-32 h-32 text-secondary" />
      </div>
      <div className="absolute bottom-32 left-20 floating-animation opacity-20" style={{ animationDelay: '-2s' }}>
        <Sparkles className="w-24 h-24 text-secondary" />
      </div>

      {/* Content */}
      <div className="container relative z-10 pt-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 text-secondary mb-6 fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Agriculture Platform</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground mb-6 fade-in-up leading-tight" style={{ animationDelay: '0.1s' }}>
            Grow Smarter,
            <br />
            <span className="text-secondary">Harvest More</span>
          </h1>

          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-8 fade-in-up max-w-2xl leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Transform your farming with AI-driven insights. Get personalized crop recommendations, 
            real-time weather alerts, and instant disease detection—all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" onClick={() => navigate('/dashboard')}>
              Start Growing Smarter
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 fade-in-up" style={{ animationDelay: '0.4s' }}>
            {[
              { value: '50K+', label: 'Active Farmers' },
              { value: '95%', label: 'Yield Improvement' },
              { value: '40%', label: 'Water Saved' },
            ].map((stat, i) => (
              <div key={i} className="text-center sm:text-left">
                <div className="text-3xl md:text-4xl font-bold text-secondary">{stat.value}</div>
                <div className="text-primary-foreground/70 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
