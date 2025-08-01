import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";
import { useSearch } from "@/contexts/SearchContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContentSection } from "@/hooks/useContent";

const SearchSection = () => {
  const { query, activeCategory, setQuery, setActiveCategory, clearSearch } = useSearch();
  const isMobile = useIsMobile();
  const { content: searchContent } = useContentSection('search', 'main');
  const { content: categoriesContent } = useContentSection('search', 'categories');

  const categories = [
    { id: "all", name: categoriesContent.all || "All" },
    { id: "community", name: categoriesContent.community || "Community" },
    { id: "education", name: categoriesContent.education || "Education" },
    { id: "environment", name: categoriesContent.environment || "Environment" },
    { id: "health", name: categoriesContent.health || "Health" },
    { id: "fundraising", name: categoriesContent.fundraising || "Fundraising" },
    { id: "other", name: categoriesContent.other || "Other" }
  ];

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <AnimatedSection variant="slideUp" delay={0.1}>
          <div className="text-center mb-8 sm:mb-12 px-4 sm:px-0">
            <AnimatedText variant="blur" delay={0.2}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold mb-4 sm:mb-6 text-primary">
                {searchContent.title || 'Find Your Perfect Volunteer Opportunity'}
              </h2>
            </AnimatedText>
            
            <AnimatedText variant="fade" delay={0.3}>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {searchContent.subtitle || 'Search and filter opportunities based on your interests, skills, and availability.'}
              </p>
            </AnimatedText>
          </div>
        </AnimatedSection>

        {/* Search Bar */}
        <AnimatedSection variant="scale" delay={0.4}>
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
                  transition: { duration: 0.4, delay: 0.5 }
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
                  transition: { duration: 0.5, delay: 0.6 }
                }}
                viewport={{ once: false }}
              >
                <Input
                  type="text"
                  placeholder={searchContent.placeholder || "Search by title, description, or category..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-12 sm:pr-4 py-4 sm:py-5 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-[#00AFCE] bg-white transition-all duration-300 hover:shadow-md focus:shadow-lg min-h-[48px] sm:min-h-[56px]"
                  aria-label="Search opportunities"
                />
                
                {/* Clear button for mobile */}
                 {query && (
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={clearSearch}
                     className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 h-8 w-8 rounded-full hover:bg-gray-100"
                     aria-label="Clear search"
                   >
                     <X className="w-4 h-4" />
                   </Button>
                 )}
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Category Filters */}
        <AnimatedSection variant="slideUp" delay={0.7}>
          <div className="mb-8 sm:mb-12">
            <div className="text-center mb-6 sm:mb-8 px-4 sm:px-0">
              <AnimatedText variant="slideUp" delay={0.8}>
                <h3 className="text-xl sm:text-2xl font-montserrat font-semibold mb-3 sm:mb-4 text-primary">Filter Opportunities</h3>
              </AnimatedText>
              
              <AnimatedText variant="fade" delay={0.9}>
                <p className="text-muted-foreground text-sm sm:text-base">Click on a category to filter opportunities</p>
              </AnimatedText>
            </div>

            <div className="overflow-x-auto pb-4 scroll-smooth" style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }}>
              <style>
                {`.overflow-x-auto::-webkit-scrollbar { display: none; }`}
              </style>
              <motion.div 
                className="flex gap-3 sm:gap-4 min-w-max px-4 snap-x snap-mandatory"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 1.0
                    }
                  }
                }}
              >
                {categories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`
                      px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-montserrat font-semibold transition-all duration-300 border-2 whitespace-nowrap text-sm sm:text-base min-h-[44px] sm:min-h-[48px] snap-start
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
                        transition: { duration: 0.3 }
                      }
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    aria-pressed={activeCategory === category.id}
                    aria-label={`Filter by ${category.name} category`}
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