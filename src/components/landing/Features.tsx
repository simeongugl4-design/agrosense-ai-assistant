import { 
  Sprout, 
  Cloud, 
  Camera, 
  Droplets, 
  FlaskConical, 
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Sprout,
    title: "Crop Recommendation AI",
    description: "Get personalized crop suggestions based on your location, soil type, and season. Maximize yield and profit with data-driven decisions.",
    color: "bg-success/10 text-success",
    borderColor: "border-success/20",
  },
  {
    icon: Cloud,
    title: "Weather Intelligence",
    description: "Daily forecasts with AI-powered alerts for rain, drought, and frost. Know the best days for sowing and harvesting.",
    color: "bg-accent/10 text-accent",
    borderColor: "border-accent/20",
  },
  {
    icon: Camera,
    title: "Disease Detection",
    description: "Upload a photo of your crop and instantly detect diseases, pests, or deficiencies. Get treatment recommendations in seconds.",
    color: "bg-destructive/10 text-destructive",
    borderColor: "border-destructive/20",
  },
  {
    icon: Droplets,
    title: "Smart Irrigation",
    description: "AI calculates optimal water needs for your crops. Prevent over/under watering and save on water and electricity costs.",
    color: "bg-accent/10 text-accent",
    borderColor: "border-accent/20",
  },
  {
    icon: FlaskConical,
    title: "Fertilizer Planner",
    description: "Precise fertilizer recommendations based on crop stage and soil conditions. Reduce costs while improving yield quality.",
    color: "bg-warning/10 text-warning",
    borderColor: "border-warning/20",
  },
  {
    icon: MessageCircle,
    title: "AI Farming Assistant",
    description: "Ask questions in your local language via text or voice. Perfect for farmers who need instant, expert guidance.",
    color: "bg-primary/10 text-primary",
    borderColor: "border-primary/20",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sprout className="w-4 h-4" />
            Powerful Features
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
            Everything You Need to 
            <span className="text-primary"> Farm Smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From crop planning to harvest optimization, our AI-powered tools help you make 
            better decisions at every stage of farming.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {feature.description}
              </p>
              <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80 group/btn">
                Learn more 
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
