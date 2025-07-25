import { ArrowRight, Users, Clock, Building } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedCard from "@/components/ui/animated-card";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";

const HeroSection = () => {
  const stats = [
    { icon: Users, label: "Active Volunteers", value: "6" },
    { icon: Clock, label: "Hours Volunteered", value: "48" },
    { icon: Building, label: "Partner Organizations", value: "4" }
  ];

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <section id="home" className="bg-white section-padding">
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
                  Connect.
                </motion.span>
                <motion.span 
                  className="block text-secondary"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: false }}
                >
                  Volunteer.
                </motion.span>
                <motion.span 
                  className="block"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: false }}
                >
                  Make a Difference.
                </motion.span>
              </h1>
            </AnimatedText>
            
            <AnimatedText variant="slideUp" delay={0.6}>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-muted-foreground">
                Join thousands of volunteers making a positive impact in their communities. 
                Find opportunities that match your skills and passion.
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
                    delayChildren: 0.7
                  }
                }
              }}
            >
              <motion.div variants={buttonVariants}>
                <PrimaryButton 
                  size="lg" 
                  className="bg-accent hover:bg-accent/90 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
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

          {/* Stats Section */}
          <AnimatedSection variant="stagger" delay={0.8}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <AnimatedCard 
                  key={stat.label}
                  index={index}
                  delay={0.1}
                  variant="lift"
                  className="group relative w-full"
                >
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 xl:p-10 text-center transition-all duration-500 hover:shadow-xl overflow-hidden h-full min-h-[200px] md:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center">
                    <motion.div 
                      className="relative flex justify-center mb-4 lg:mb-6"
                      whileHover={{ scale: 1.1, rotateY: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md">
                        <stat.icon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                      </div>
                    </motion.div>
                    <motion.div 
                      className="relative text-3xl md:text-4xl lg:text-5xl font-montserrat font-black mb-2 lg:mb-3 text-secondary"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="relative text-sm md:text-base lg:text-lg text-gray-600 font-montserrat font-semibold tracking-wide leading-tight">
                      {stat.label}
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;