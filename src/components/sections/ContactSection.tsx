import { useState } from "react";
import { Send, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { useToast } from "@/hooks/use-toast";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedCard from "@/components/ui/animated-card";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "", 
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setFormData({ name: "", email: "", message: "" });
    
    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you within 24 hours.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      content: "hello@communityconnect.org",
      description: "Send us a message anytime"
    },
    {
      icon: Phone, 
      title: "Call Us",
      content: "(555) 123-4567",
      description: "Monday - Friday, 9AM - 5PM"
    },
    {
      icon: MapPin,
      title: "Visit Us", 
      content: "1846 South Main Street",
      description: "Upland, CA 91784"
    }
  ];

  const formFieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <section id="contact" className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <AnimatedSection variant="slideUp" delay={0.1}>
          <div className="text-center mb-12">
            <AnimatedText variant="blur" delay={0.2}>
              <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
                Get In Touch
              </h2>
            </AnimatedText>
            
            <AnimatedText variant="fade" delay={0.3}>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Have questions or want to learn more about our volunteer opportunities? 
                Send us a message and we'll get back to you soon.
              </p>
            </AnimatedText>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <AnimatedSection variant="slideLeft" delay={0.4}>
            <AnimatedText variant="slideUp" delay={0.5}>
              <h3 className="text-2xl md:text-3xl font-montserrat font-bold mb-8 text-primary">Contact Information</h3>
            </AnimatedText>
            
            <motion.div 
              className="space-y-6"
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
              {contactInfo.map((info, index) => (
                <AnimatedCard
                  key={info.title}
                  index={index}
                  delay={0.05}
                  variant="lift"
                >
                  <motion.div 
                    className="bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300"
                    whileHover={{
                      y: -4,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className="w-12 h-12 bg-[#00AFCE] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
                        whileHover={{ 
                          scale: 1.1, 
                          rotateY: 10,
                          transition: { duration: 0.3 }
                        }}
                      >
                        <info.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <motion.h4 
                          className="font-montserrat font-bold text-primary mb-1"
                          whileHover={{ 
                            color: "#00AFCE",
                            transition: { duration: 0.2 }
                          }}
                        >
                          {info.title}
                        </motion.h4>
                        <p className="text-lg font-medium text-foreground mb-1">{info.content}</p>
                        <p className="text-sm text-muted-foreground font-montserrat font-semibold">{info.description}</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatedCard>
              ))}
            </motion.div>

            {/* Additional Info */}
            <AnimatedCard delay={0.8} variant="glow">
              <motion.div 
                className="mt-12 bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300"
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.h4 
                  className="font-montserrat font-bold text-primary mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { duration: 0.4, delay: 0.9 }
                  }}
                  viewport={{ once: false }}
                >
                  Quick Response
                </motion.h4>
                <motion.p 
                  className="text-muted-foreground text-sm leading-relaxed"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { duration: 0.4, delay: 1.0 }
                  }}
                  viewport={{ once: false }}
                >
                  We typically respond to messages within 24 hours during business days. 
                  For urgent matters, please call us directly.
                </motion.p>
              </motion.div>
            </AnimatedCard>
          </AnimatedSection>

          {/* Contact Form */}
          <AnimatedSection variant="slideRight" delay={0.5}>
            <motion.div 
              className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300"
              whileHover={{
                y: -4,
                transition: { duration: 0.3 }
              }}
            >
              <AnimatedText variant="slideUp" delay={0.6}>
                <h3 className="text-2xl md:text-3xl font-montserrat font-bold mb-6 text-primary">Send us a Message</h3>
              </AnimatedText>
              
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-6"
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
                <motion.div variants={formFieldVariants}>
                  <label htmlFor="name" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    Your Name *
                  </label>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00AFCE] transition-all duration-300"
                    />
                  </motion.div>
                </motion.div>

                <motion.div variants={formFieldVariants}>
                  <label htmlFor="email" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    Your Email *
                  </label>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00AFCE] transition-all duration-300"
                    />
                  </motion.div>
                </motion.div>

                <motion.div variants={formFieldVariants}>
                  <label htmlFor="message" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    Your Message *
                  </label>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Tell us how we can help you..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00AFCE] transition-all duration-300 resize-none"
                    />
                  </motion.div>
                </motion.div>

                <motion.div variants={formFieldVariants}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PrimaryButton
                      type="submit"
                      size="lg"
                      loading={isSubmitting}
                      className="w-full bg-[#00AFCE] hover:bg-[#00AFCE]/90 transform transition-all duration-300 hover:shadow-lg"
                    >
                      <Send className="mr-2 w-5 h-5" />
                      Send Message
                    </PrimaryButton>
                  </motion.div>
                </motion.div>
              </motion.form>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;