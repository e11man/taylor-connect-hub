import { Users, Clock, Building } from "lucide-react";
import { useContentSection } from "@/hooks/useContent";
import AnimatedSection from "@/components/ui/animated-section";
import { motion } from "framer-motion";
import CountUpNumber from "@/components/ui/CountUpNumber";
import { useContentStats } from "@/hooks/useContentStats";
import { Skeleton } from "@/components/ui/skeleton";

const ImpactSection = () => {
  const { content: impactContent, loading: impactLoading } = useContentSection('homepage', 'impact');
  const { content: aboutImpactContent } = useContentSection('about', 'impact');
  const { stats, loading: statsLoading } = useContentStats();
  
  const statsData = [
    { 
      icon: Users, 
      label: impactContent.volunteers_label || "Active Volunteers", 
      value: stats?.volunteers_count || "0",
      description: aboutImpactContent.volunteers_description || "Passionate individuals serving Upland"
    },
    { 
      icon: Clock, 
      label: impactContent.hours_label || "Hours Contributed", 
      value: stats?.hours_served_total || "0",
      description: aboutImpactContent.hours_description || "Collective time dedicated to service"
    },
    { 
      icon: Building, 
      label: impactContent.organizations_label || "Partner Organizations", 
      value: stats?.partner_orgs_count || "0",
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
        {impactLoading || statsLoading ? (
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="space-y-4">
              <Skeleton className="h-12 w-1/2 mx-auto" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-16 w-16 mx-auto rounded-2xl" />
                    <Skeleton className="h-8 w-20 mx-auto" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
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

            {/* Compact mobile stats (match homepage hero style) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={containerVariants}
              className="grid grid-cols-3 gap-3 max-w-4xl mx-auto md:hidden"
            >
              {statsData.map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  variants={itemVariants}
                  className="group relative w-full"
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-3 text-center transition-all duration-500 hover:shadow-xl overflow-hidden h-full min-h-[120px] flex flex-col justify-center">
                    <div className="relative flex justify-center mb-2">
                      <div className="w-8 h-8 bg-[#00AFCE] rounded-lg flex items-center justify-center shadow-md">
                        <stat.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="relative text-xl font-montserrat font-black mb-1 text-secondary">
                      <CountUpNumber value={stat.value} />
                    </div>
                    <div className="relative text-xs text-gray-600 font-montserrat font-semibold tracking-wide leading-tight">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Original detailed cards for md and up */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={containerVariants}
              className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            >
              {statsData.map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  variants={itemVariants}
                  className="group relative bg-white border-2 border-gray-200 rounded-3xl p-10 text-center transition-all duration-500 hover:shadow-lg hover:scale-105 hover:border-[#00AFCE] overflow-hidden"
                >
                  <div className="relative flex justify-center mb-6">
                    <div className="w-16 h-16 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="relative text-3xl lg:text-4xl xl:text-5xl font-montserrat font-black mb-3 text-secondary group-hover:scale-110 transition-transform duration-300">
                    <CountUpNumber value={stat.value} />
                  </div>
                  <div className="relative text-sm lg:text-base xl:text-lg font-montserrat font-bold mb-2 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                    {stat.label}
                  </div>
                  <div className="relative text-base text-muted-foreground font-montserrat font-semibold leading-relaxed">
                    {stat.description}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default ImpactSection;