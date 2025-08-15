import { Heart, Globe, Users, HandHeart } from "lucide-react";
import { useContentSection } from "@/hooks/useContent";
import { motion } from "framer-motion";

const WhatWeDoSection = () => {
  const { content: whatWeDoContent } = useContentSection('about', 'what_we_do');
  
  const services = [
    {
      icon: Heart,
      title: whatWeDoContent.local_ministries_title || "Local Ministries",
      description: whatWeDoContent.local_ministries_description || "Taylor World Outreach (TWO) ministries provide hands-on opportunities to serve in our local Upland and beyond. These programs focus on meeting immediate needs while building lasting relationships."
    },
    {
      icon: Users,
      title: whatWeDoContent.community_plunge_title || "Community Plunge",
      description: whatWeDoContent.community_plunge_description || "Our signature immersive experience where volunteers dive deep into service in Upland, building connections and creating lasting impact through intensive, focused engagement."
    },
    {
      icon: Globe,
      title: whatWeDoContent.world_opportunities_title || "World Opportunities",
      description: whatWeDoContent.world_opportunities_description || "Learn about opportunities to serve globally, from short-term mission trips to long-term international partnerships that expand your impact beyond local borders."
    },
    {
      icon: HandHeart,
      title: whatWeDoContent.community_outreach_title || "Community Outreach Programs",
      description: whatWeDoContent.community_outreach_description || "Share the love of Christ through diverse service opportunities that address real needs in Upland and foster meaningful relationships."
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
      y: 20
    },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  const descriptionVariants = {
    hidden: { 
      opacity: 0, 
      y: 15
    },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <section id="what-we-do" className="bg-white section-padding">
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
            {whatWeDoContent.title || 'What We Do'}
          </motion.h2>
          
          <motion.p 
            variants={descriptionVariants}
            className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-4xl mx-auto"
          >
            {whatWeDoContent.description || 'Community Connect facilitates a wide array of volunteer opportunities, from local ministry work to global outreach initiatives. We partner with organizations that share our commitment to making a positive difference in Upland.'}
          </motion.p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          {services.map((service, index) => (
            <motion.div 
              key={service.title}
              variants={itemVariants}
              className="group relative bg-white border-2 border-gray-200 rounded-3xl p-8 transition-all duration-500 hover:shadow-lg hover:scale-105 hover:border-[#00AFCE]"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-montserrat">
                    {service.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhatWeDoSection;