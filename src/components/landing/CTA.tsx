import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTA() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 opacity-10">
        <Leaf className="w-40 h-40 text-secondary" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-10 rotate-180">
        <Leaf className="w-32 h-32 text-secondary" />
      </div>

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-6">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
            Join thousands of farmers already using AgroSense AI to increase yields, 
            reduce costs, and farm more sustainably.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={() => navigate('/dashboard')}>
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl">
              Schedule a Demo
            </Button>
          </div>
          <p className="text-primary-foreground/60 text-sm mt-6">
            No credit card required • Free for small farms • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
