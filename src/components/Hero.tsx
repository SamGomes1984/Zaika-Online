import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-bakery.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Fresh artisanal bread"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 animate-float opacity-20">
        <Sparkles className="h-16 w-16 text-accent" />
      </div>
      <div className="absolute bottom-40 right-40 animate-float-delayed opacity-20">
        <Sparkles className="h-12 w-12 text-accent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-secondary/80 backdrop-blur-sm px-4 py-2 rounded-full">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground">
              Freshly Baked Daily
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
            Discover the{" "}
            <span className="text-gradient-golden">Art of Baking</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            Handcrafted with love, tradition, and the finest ingredients. Every bite
            tells a story of passion and perfection.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link to="/products">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Explore Our Flavours
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Our Story
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
