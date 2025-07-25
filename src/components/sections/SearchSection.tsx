import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";

const SearchSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", name: "All" },
    { id: "community", name: "Community" },
    { id: "education", name: "Education" },
    { id: "environment", name: "Environment" },
    { id: "health", name: "Health" },
    { id: "fundraising", name: "Fundraising" },
    { id: "other", name: "Other" }
  ];

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <AnimatedSection variant="slideUp" delay={0.2}>
          <div className="text-center mb-8 sm:mb-12 px-4 sm:px-0">
            <AnimatedText variant="blur" delay={0.4}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold mb-4 sm:mb-6 text-primary">
                Find Your Perfect Volunteer Opportunity
              </h2>
            </AnimatedText>
            
            <AnimatedText variant="fade" delay={0.6}>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Search and filter opportunities based on your interests, skills, and availability.
              </p>
            </AnimatedText>
          </div>
        </AnimatedSection>

        {/* Search Bar */}
        <AnimatedSection variant="scale" delay={0.8}>
          <div className="max-w-2xl mx-auto mb-8 sm:mb-12 px-4 sm:px-0">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { duration: 0.6, delay: 1.0 }
                }}
                viewport={{ once: false }}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.7, delay: 1.2 }
                }}
                viewport={{ once: false }}
              >
                <Input
                  type="text"
                  placeholder="Search by title, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-[#00AFCE] bg-white transition-all duration-300 hover:shadow-md focus:shadow-lg"
                />
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Category Filters */}
        <AnimatedSection variant="slideUp" delay={1.4}>
          <div className="mb-8 sm:mb-12">
            <div className="text-center mb-6 sm:mb-8 px-4 sm:px-0">
              <AnimatedText variant="slideUp" delay={1.6}>
                <h3 className="text-xl sm:text-2xl font-montserrat font-semibold mb-3 sm:mb-4 text-primary">Filter Opportunities</h3>
              </AnimatedText>
              
              <AnimatedText variant="fade" delay={1.8}>
                <p className="text-muted-foreground text-sm sm:text-base">Click on a category to filter opportunities</p>
              </AnimatedText>
            </div>

            <div className="overflow-x-auto pb-4" style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}>
              <style>
                {`.overflow-x-auto::-webkit-scrollbar { display: none; }`}
              </style>
              <motion.div 
                className="flex gap-3 sm:gap-4 min-w-max px-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 2.0
                    }
                  }
                }}
              >
                {categories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`
                      px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-montserrat font-semibold transition-all duration-300 border-2 whitespace-nowrap text-sm sm:text-base
                      ${activeCategory === category.id
                        ? 'bg-[#E14F3D] text-white border-[#E14F3D] shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#00AFCE] hover:text-[#00AFCE]'
                      }
                    `}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.9 },
                      visible: { 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        transition: { duration: 0.5 }
                      }
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default SearchSection;