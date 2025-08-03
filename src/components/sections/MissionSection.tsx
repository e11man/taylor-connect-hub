import { useContentSection } from "@/hooks/useContent";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedText from "@/components/ui/animated-text";

const MissionSection = () => {
  const { content: missionContent } = useContentSection('homepage', 'mission');
  
  return (
    <section id="mission" className="bg-white section-padding">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto">
          {/* Section Header */}
          <AnimatedSection variant="fade" delay={0.1}>
            <AnimatedText variant="blur" delay={0.2}>
              <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
                {missionContent.title || 'Our Mission'}
              </h2>
            </AnimatedText>
            
            <AnimatedText variant="slideUp" delay={0.3}>
              <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-5xl mx-auto">
                {missionContent.description || 'Community Connect is dedicated to fostering meaningful relationships between passionate volunteers and impactful opportunities. We believe that when individuals come together with shared purpose, they can create transformative change that extends far beyond individual efforts. Our platform serves as a bridge, connecting hearts and hands to build stronger, more resilient Upland through collective action.'}
              </p>
            </AnimatedText>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;