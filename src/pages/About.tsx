import { Heart, Award, Users, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import aboutImage from "@/assets/about-baker.jpg";

const About = () => {
  return (
    <div className="min-h-screen"
>
        {/* Hero Section */}
        <section className="relative py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Our <span className="text-accent">Story</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Zaika Toast began with a simple passion: to bring the authentic taste of
                artisanal baking to every home. Every loaf, every pastry, every bite is a
                testament to our commitment to quality and tradition.
              </p>
            </div>
          </div>
        </section>

        {/* Image and Mission */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <img
                  src={aboutImage}
                  alt="Baker at work"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-display font-bold">
                  Baked with <span className="text-accent">Passion</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our journey started in a small kitchen with a dream to create exceptional
                  baked goods using time-honored techniques and the finest ingredients.
                  Today, we're proud to serve thousands of happy customers who trust us
                  with their special moments.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Every product is handcrafted by our team of expert bakers who bring years
                  of experience and genuine love for their craft. We believe in quality
                  over quantity, tradition over shortcuts, and taste over everything else.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-secondary/20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-center mb-12">
              Our <span className="text-accent">Values</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center hover-lift border-border">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                    <Heart className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Made with Love</h3>
                  <p className="text-sm text-muted-foreground">
                    Every product is crafted with care, attention, and genuine passion
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover-lift border-border">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                    <Award className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
                  <p className="text-sm text-muted-foreground">
                    We never compromise on ingredients or craftsmanship
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover-lift border-border">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                    <Leaf className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Natural Ingredients</h3>
                  <p className="text-sm text-muted-foreground">
                    Fresh, natural, and ethically sourced ingredients only
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover-lift border-border">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Community First</h3>
                  <p className="text-sm text-muted-foreground">
                    Building lasting relationships with our customers and community
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-accent mb-2">10+</p>
                <p className="text-muted-foreground">Years Experience</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-accent mb-2">50K+</p>
                <p className="text-muted-foreground">Happy Customers</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-accent mb-2">100+</p>
                <p className="text-muted-foreground">Products</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-accent mb-2">15+</p>
                <p className="text-muted-foreground">Master Bakers</p>
              </div>
            </div>
          </div>
        </section>
    </div>
  );
};

export default About;
