import { ArrowRight, Users, Clock, Building } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";

const HeroSection = () => {
  const stats = [
    { icon: Users, label: "Active Volunteers", value: "6" },
    { icon: Clock, label: "Hours Volunteered", value: "48" },
    { icon: Building, label: "Partner Organizations", value: "4" }
  ];

  return (
    <section id="home" className="bg-white section-padding">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Hero Content */}
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-montserrat font-bold mb-6 leading-tight text-primary">
              <span className="block">Connect.</span>
              <span className="block text-secondary">Volunteer.</span>
              <span className="block">Make a Difference.</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-muted-foreground">
              Join thousands of volunteers making a positive impact in their communities. 
              Find opportunities that match your skills and passion.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <PrimaryButton size="lg" className="bg-accent hover:bg-accent/90">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </PrimaryButton>
              <SecondaryButton size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                Learn More
              </SecondaryButton>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="bg-white border border-border rounded-lg p-8 text-center transition-smooth hover:shadow-lg"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-montserrat font-bold mb-2 text-secondary">{stat.value}</div>
                <div className="text-muted-foreground font-montserrat font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;