import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";
import { useContentSection } from "@/hooks/useContent";

const AboutHeroSection = () => {
  const navigate = useNavigate();
  const { content: heroContent } = useContentSection('about', 'hero');
  
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <section id="about-hero" className="bg-white section-padding">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Hero Content */}
          <AnimatedSection variant="fade" delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-montserrat font-bold mb-6 leading-tight text-primary">
              <span className="block">
                {heroContent.titleLine1 || 'Make the'}
              </span>
              <span className="block text-secondary">
                {heroContent.titleLine2 || 'Connection'}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-muted-foreground">
              {heroContent.subtitle || 'Connect with meaningful opportunities that create lasting impact in Upland.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <SecondaryButton 
                size="lg"
                onClick={() => {
                  const contactSection = document.getElementById('contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {heroContent.secondaryButton || 'Learn More'}
              </SecondaryButton>
              <PrimaryButton 
                size="lg"
                onClick={() => navigate("/")}
              >
                {heroContent.ctaButton || 'Find Opportunities'} <ArrowRight className="ml-2 w-5 h-5" />
              </PrimaryButton>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default AboutHeroSection;