import { ArrowRight, Users, Clock, Building } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import heroOceanBg from "@/assets/hero-ocean-bg.jpg";

const HeroSection = () => {
  const stats = [
    { icon: Users, label: "Active Volunteers", value: "6" },
    { icon: Clock, label: "Hours Volunteered", value: "48" },
    { icon: Building, label: "Partner Organizations", value: "4" }
  ];

  return (
    <section 
      id="home" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${heroOceanBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Ocean Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/40 to-accent/30 backdrop-blur-[1px]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-accent/20 rounded-full animate-float" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-primary/20 rounded-full animate-wave" />
      <div className="absolute top-1/3 right-10 w-16 h-16 bg-accent/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 container-ocean text-center text-white">
        {/* Main Hero Content */}
        <div className="animate-slide-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="block">Connect.</span>
            <span className="block text-gradient-ocean bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
              Volunteer.
            </span>
            <span className="block">Make a Difference.</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-white/90">
            Join thousands of volunteers making a positive impact in their communities. 
            Find opportunities that match your skills and passion.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <PrimaryButton 
              size="lg" 
              variant="glow"
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow"
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </PrimaryButton>
            <SecondaryButton 
              size="lg" 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Learn More
            </SecondaryButton>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="card-ocean bg-white/10 backdrop-blur-md border-white/20 text-center hover-glow"
              style={{ animationDelay: `${0.7 + index * 0.2}s` }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-2 text-accent">{stat.value}</div>
              <div className="text-white/80 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;