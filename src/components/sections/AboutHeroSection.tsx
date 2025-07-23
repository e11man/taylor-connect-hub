import { ArrowRight } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";

const AboutHeroSection = () => {
  return (
    <section id="about-hero" className="bg-white section-padding">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Hero Content */}
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-montserrat font-bold mb-6 leading-tight text-primary">
              <span className="block">Make the</span>
              <span className="block text-secondary">Connection</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-muted-foreground">
              Connect with meaningful opportunities that create lasting impact in Upland.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <PrimaryButton size="lg" className="bg-[#00AFCE] hover:bg-[#00AFCE]/90">
                Find Opportunities <ArrowRight className="ml-2 w-5 h-5" />
              </PrimaryButton>
              <SecondaryButton size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                Learn More
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHeroSection;