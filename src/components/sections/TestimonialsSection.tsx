import { Quote } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedCard from "@/components/ui/animated-card";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      content: "Community Connect helped me find the perfect volunteer opportunity. I've made lifelong friends while making a real difference in our community.",
      author: "Sarah Johnson",
      role: "Volunteer",
      initial: "S",
      highlight: false
    },
    {
      id: 2,
      content: "The platform made it so easy to find volunteers for our literacy program. We've been able to reach twice as many students this year.",
      author: "Marcus Chen",
      role: "Program Director", 
      initial: "M",
      highlight: false
    },
    {
      id: 3,
      content: "I love how the opportunities are categorized and filtered. It's never been easier to find causes I'm passionate about.",
      author: "Emma Rodriguez",
      role: "Student",
      initial: "E",
      highlight: true
    }
  ];

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <AnimatedSection variant="slideUp" delay={0.1}>
          <div className="text-center mb-12">
            <AnimatedText variant="blur" delay={0.2}>
              <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
                Stories of Impact
              </h2>
            </AnimatedText>
            
            <AnimatedText variant="fade" delay={0.3}>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Discover how Community Connect is bringing people together and making a difference in our community.
              </p>
            </AnimatedText>
          </div>
        </AnimatedSection>

        {/* Testimonials Grid */}
        <AnimatedSection variant="stagger" delay={0.4}>
          <div className="mb-12">
            <div className="flex flex-nowrap gap-6 overflow-x-auto pb-4 md:pb-0 md:flex-wrap md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {testimonials.map((testimonial, index) => (
                <AnimatedCard
                  key={testimonial.id}
                  index={index}
                  delay={0.1}
                  variant="lift"
                  className="flex-shrink-0 w-80 min-w-80 md:w-auto"
                >
                  <motion.div 
                    className={`
                      bg-white rounded-3xl p-8 border-2 transition-all duration-300 h-full flex flex-col
                      ${testimonial.highlight 
                        ? 'border-[#00AFCE] shadow-lg' 
                        : 'border-gray-200 hover:border-[#00AFCE] hover:shadow-lg'
                      }
                    `}
                    whileHover={{
                      y: -8,
                      transition: { duration: 0.3 }
                    }}
                  >
                    {/* Quote Icon */}
                    <div className="flex justify-between items-start mb-6">
                      <motion.div 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                          testimonial.highlight ? 'bg-[#E14F3D]' : 'bg-[#00AFCE]'
                        }`}
                        whileHover={{ 
                          scale: 1.1, 
                          rotateZ: 10,
                          transition: { duration: 0.3 }
                        }}
                      >
                        <Quote className="w-6 h-6 text-white" />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <motion.blockquote 
                      className="text-lg leading-relaxed mb-6 text-muted-foreground italic flex-grow"
                      initial={{ opacity: 0 }}
                      whileInView={{ 
                        opacity: 1,
                        transition: { duration: 0.4, delay: 0.1 }
                      }}
                      viewport={{ once: false }}
                    >
                      "{testimonial.content}"
                    </motion.blockquote>

                    {/* Author */}
                    <motion.div 
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ 
                        opacity: 1, 
                        x: 0,
                        transition: { duration: 0.4, delay: 0.2 }
                      }}
                      viewport={{ once: false }}
                    >
                      <motion.div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-montserrat font-bold text-white ${
                          testimonial.highlight ? 'bg-[#E14F3D]' : 'bg-[#00AFCE]'
                        }`}
                        whileHover={{ 
                          scale: 1.1,
                          transition: { duration: 0.2 }
                        }}
                      >
                        {testimonial.initial}
                      </motion.div>
                      <div>
                        <motion.div 
                          className="font-montserrat font-bold text-primary"
                          whileHover={{ 
                            color: "#00AFCE",
                            transition: { duration: 0.2 }
                          }}
                        >
                          {testimonial.author}
                        </motion.div>
                        <div className="text-sm text-muted-foreground font-montserrat font-semibold">
                          {testimonial.role}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Call to Action */}
        <AnimatedSection variant="scale" delay={0.6}>
          <motion.div 
            className="bg-white border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300 rounded-3xl max-w-2xl mx-auto text-center p-8"
            whileHover={{ 
              scale: 1.02,
              y: -4,
              transition: { duration: 0.3 }
            }}
          >
            <AnimatedText variant="slideUp" delay={0.7}>
              <h3 className="text-2xl md:text-3xl font-montserrat font-bold mb-4 text-primary">
                Ready to Make Your Impact?
              </h3>
            </AnimatedText>
            
            <AnimatedText variant="fade" delay={0.8}>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Join our community of volunteers and start making a difference today.
              </p>
            </AnimatedText>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.9
                  }
                }
              }}
            >
              <motion.div variants={buttonVariants}>
                <PrimaryButton 
                  size="lg" 
                  className="bg-[#00AFCE] hover:bg-[#00AFCE]/90 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Start Volunteering
                </PrimaryButton>
              </motion.div>
              <motion.div variants={buttonVariants}>
                <SecondaryButton 
                  size="lg" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-white transform transition-all duration-300 hover:scale-105"
                >
                  Partner With Us
                </SecondaryButton>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default TestimonialsSection;