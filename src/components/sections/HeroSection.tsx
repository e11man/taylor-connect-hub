import { ArrowRight, Users, Clock, Building } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedCard from "@/components/ui/animated-card";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";
import { useContentSection } from "@/hooks/useContent";
import { useSiteStatistics } from "@/hooks/useSiteStatistics";
import { Skeleton } from "@/components/ui/skeleton";

const HeroSection = () => {
  const { content: heroContent, loading: heroLoading } = useContentSection('homepage', 'hero');
  const { content: impactContent, loading: impactLoading } = useContentSection('homepage', 'impact');
  const { statistics: siteStats, loading: statsLoading } = useSiteStatistics();
  
  // Extract content with fallbacks
  const titleLine1 = heroContent.titleLine1 || "Connect.";
  const titleLine2 = heroContent.titleLine2 || "Volunteer.";
  const titleLine3 = heroContent.titleLine3 || "Make a Difference.";
  const subtitle = heroContent.subtitle || "Join thousands of volunteers making a positive impact in their communities. Find opportunities that match your skills and passion.";
  const ctaButton = heroContent.ctaButton || "Get Started";
  const secondaryButton = heroContent.secondaryButton || "Learn More";
  
  const stats = [
    { 
      icon: Users, 
      label: impactContent.volunteers_label || "Active Volunteers", 
      value: siteStats?.active_volunteers?.display_value?.toLocaleString() || "0"
    },
    { 
      icon: Clock, 
      label: impactContent.hours_label || "Hours Contributed", 
      value: siteStats?.hours_contributed?.display_value?.toLocaleString() || "0"
    },
    { 
      icon: Building, 
      label: impactContent.organizations_label || "Partner Organizations", 
      value: siteStats?.partner_organizations?.display_value?.toLocaleString() || "0"
    }
  ];

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  // Show loading skeleton for the entire hero section on initial load
  if ((heroLoading && Object.keys(heroContent).length === 0) || statsLoading) {
    return (
      <section id="home" className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center max-w-4xl mx-auto">
            <div className="space-y-4">
              <Skeleton className="h-16 w-3/4 mx-auto" />
              <Skeleton className="h-16 w-2/3 mx-auto" />
              <Skeleton className="h-16 w-3/4 mx-auto" />
              <Skeleton className="h-8 w-full max-w-2xl mx-auto" />
              <div className="flex gap-4 justify-center mt-8">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="home" className="bg-white section-padding relative">

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
                  transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  viewport={{ once: false }}
                >
                  {titleLine1}
                </motion.span>
                <motion.span 
                  className="block text-secondary"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  viewport={{ once: false }}
                >
                  {titleLine2}
                </motion.span>
                <motion.span 
                  className="block"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  viewport={{ once: false }}
                >
                  {titleLine3}
                </motion.span>
              </h1>
            </AnimatedText>
            
            <AnimatedText variant="slideUp" delay={0.6}>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-muted-foreground">
                {subtitle}
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
              <motion.div 
                variants={buttonVariants}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <SecondaryButton 
                  size="lg"
                >
                  {secondaryButton}
                </SecondaryButton>
              </motion.div>
              <motion.div 
                variants={buttonVariants}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
              >
                <PrimaryButton 
                  size="lg"
                >
                  {ctaButton} <ArrowRight className="ml-2 w-5 h-5" />
                </PrimaryButton>
              </motion.div>
            </motion.div>
          </AnimatedSection>

          {/* Stats Section */}
          <AnimatedSection variant="stagger" delay={0.8}>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6 lg:gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <AnimatedCard 
                  key={stat.label}
                  index={index}
                  delay={0.1}
                  variant="lift"
                  className="group relative w-full"
                >
                  <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-3 md:p-6 lg:p-8 text-center transition-all duration-500 hover:shadow-xl overflow-hidden h-full min-h-[120px] md:min-h-[180px] lg:min-h-[200px] flex flex-col justify-center">
                    <motion.div 
                      className="relative flex justify-center mb-2 md:mb-4 lg:mb-6"
                      whileHover={{ scale: 1.1, rotateY: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-8 h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-[#00AFCE] rounded-lg md:rounded-2xl flex items-center justify-center shadow-md">
                        <stat.icon className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
                      </div>
                    </motion.div>
                    <motion.div 
                      className="relative text-xl md:text-3xl lg:text-4xl xl:text-5xl font-montserrat font-black mb-1 md:mb-2 lg:mb-3 text-secondary"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="relative text-xs md:text-sm lg:text-base xl:text-lg text-gray-600 font-montserrat font-semibold tracking-wide leading-tight">
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