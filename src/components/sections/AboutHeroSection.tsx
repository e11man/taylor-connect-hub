import { ArrowRight } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";

const AboutHeroSection = () => {
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
            <AnimatedText variant="blur" delay={0.2}>
              <h1 className="text-5xl md:text-7xl font-montserrat font-bold mb-6 leading-tight text-primary">
                <motion.span 
                  className="block"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: false }}
                >
                  Make the
                </motion.span>
                <motion.span 
                  className="block text-secondary"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: false }}
                >
                  Connection
                </motion.span>
              </h1>
            </AnimatedText>
            
            <AnimatedText variant="slideUp" delay={0.5}>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-muted-foreground">
                Connect with meaningful opportunities that create lasting impact in Upland.
              </p>
            </AnimatedText>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.6
                  }
                }
              }}
            >
              <motion.div variants={buttonVariants}>
                <PrimaryButton 
                  size="lg" 
                  className="bg-[#00AFCE] hover:bg-[#00AFCE]/90 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Find Opportunities <ArrowRight className="ml-2 w-5 h-5" />
                </PrimaryButton>
              </motion.div>
              <motion.div variants={buttonVariants}>
                <SecondaryButton 
                  size="lg" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-white transform transition-all duration-300 hover:scale-105"
                >
                  Learn More
                </SecondaryButton>
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default AboutHeroSection;