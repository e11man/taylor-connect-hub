import { Users, Clock, Building } from "lucide-react";
import { useContentSection } from "@/hooks/useContent";
import { useSiteStatistics } from "@/hooks/useSiteStatistics";
import AnimatedSection from "@/components/ui/animated-section";
import { motion } from "framer-motion";

const ImpactSection = () => {
  const { content: impactContent, loading: impactLoading } = useContentSection('homepage', 'impact');
  const { content: aboutImpactContent } = useContentSection('about', 'impact');
  const { statistics: siteStats, loading: statsLoading } = useSiteStatistics();
  
  const stats = [
    { 
      icon: Users, 
      label: impactContent.volunteers_label || "Active Volunteers", 
      value: siteStats?.active_volunteers?.display_value?.toLocaleString() || "0",
      description: aboutImpactContent.volunteers_description || "Passionate individuals serving Upland"
    },
    { 
      icon: Clock, 
      label: impactContent.hours_label || "Hours Contributed", 
      value: siteStats?.hours_contributed?.display_value?.toLocaleString() || "0",
      description: aboutImpactContent.hours_description || "Collective time dedicated to service"
    },
    { 
      icon: Building, 
      label: impactContent.organizations_label || "Partner Organizations", 
      value: siteStats?.partner_organizations?.display_value?.toLocaleString() || "0",
      description: aboutImpactContent.organizations_description || "Local organizations making a difference"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    }
  };

  const titleVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      filter: "blur(8px)"
    },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)"
    }
  };

  return (
    <section id="impact" className="bg-white section-padding">
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          {/* Section Header */}
          <motion.h2 
            variants={titleVariants}
            className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary"
          >
            {aboutImpactContent.title || 'Our Impact'}
          </motion.h2>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              variants={itemVariants}
              className="group relative bg-white border-2 border-gray-200 rounded-3xl p-8 md:p-10 text-center transition-all duration-500 hover:shadow-lg hover:scale-105 hover:border-[#00AFCE] overflow-hidden"
            >
              <div className="relative flex justify-center mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
              <div className="relative text-xl md:text-3xl lg:text-4xl xl:text-5xl font-montserrat font-black mb-3 text-secondary group-hover:scale-110 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="relative text-xs md:text-sm lg:text-base xl:text-lg font-montserrat font-bold mb-2 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                {stat.label}
              </div>
              <div className="relative text-sm md:text-base text-muted-foreground font-montserrat font-semibold leading-relaxed">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ImpactSection;