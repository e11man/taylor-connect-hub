import { Package, Users, Hammer, BookOpen, TrendingUp, Heart } from "lucide-react";
import { useContentSection } from "@/hooks/useContent";
import { motion } from "framer-motion";

const ProgramsSection = () => {
  const { content: programsContent } = useContentSection('about', 'programs');
  
  const programs = [
    {
      icon: Package,
      title: programsContent.basics_title || "Basics",
      description: programsContent.basics_description || "Essential needs support for families and individuals"
    },
    {
      icon: Users,
      title: programsContent.basics_jr_title || "Basics Jr.",
      description: programsContent.basics_jr_description || "Youth-focused programs for children and teens"
    },
    {
      icon: Hammer,
      title: programsContent.carpenters_hands_title || "Carpenter's Hands",
      description: programsContent.carpenters_hands_description || "Home repair and construction projects"
    },
    {
      icon: BookOpen,
      title: programsContent.esl_title || "ESL",
      description: programsContent.esl_description || "English as Second Language tutoring and support"
    },
    {
      icon: TrendingUp,
      title: programsContent.lift_title || "Lift",
      description: programsContent.lift_description || "Mentorship and encouragement programs"
    },
    {
      icon: Heart,
      title: programsContent.realife_title || "ReaLife",
      description: programsContent.realife_description || "Real-life skills and life coaching"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <section id="programs" className="bg-white section-padding">
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
            {programsContent.title || 'Community Outreach Programs'}
          </motion.h2>
          
          <motion.p 
            variants={descriptionVariants}
            className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-4xl mx-auto"
          >
            {programsContent.description || 'Share the love of Christ through diverse service opportunities that address real needs in Upland and foster meaningful relationships.'}
          </motion.p>
        </motion.div>

        {/* Programs Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
        >
          {programs.map((program, index) => (
            <motion.div 
              key={program.title}
              variants={itemVariants}
              className="group relative bg-white border-2 border-gray-200 rounded-3xl p-6 md:p-8 text-center transition-all duration-500 hover:shadow-lg hover:scale-105 hover:border-[#00AFCE]"
            >
              <div className="relative flex justify-center mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <program.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl md:text-2xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                {program.title}
              </h3>
              
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-montserrat">
                {program.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProgramsSection;