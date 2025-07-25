import { useState } from "react";
import communityGarden from "@/assets/community-garden.jpg";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import UserAuthModal from "@/components/modals/UserAuthModal";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const CallToActionSection = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Image */}
          <AnimatedSection variant="slideLeft" delay={0.1}>
            <motion.div 
              className="relative rounded-2xl overflow-hidden shadow-lg"
              whileHover={{ 
                scale: 1.02, 
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              style={{ transformPerspective: 1000 }}
            >
              <motion.img 
                src={communityGarden}
                alt="Volunteers working together in a community garden"
                className="w-full h-auto object-cover"
                initial={{ scale: 1.1 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: false }}
              />
              <motion.div 
                className="absolute inset-0 bg-primary/10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: false }}
              />
            </motion.div>
          </AnimatedSection>

          {/* Content */}
          <AnimatedSection variant="slideRight" delay={0.2}>
            <AnimatedText variant="slideUp" delay={0.3}>
              <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
                Join Our Community
              </h2>
            </AnimatedText>
            
            <AnimatedText variant="fade" delay={0.4}>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Be part of something bigger. Connect with like-minded volunteers 
                and make a meaningful impact in your local community.
              </p>
            </AnimatedText>
            
            {/* Sign In Section */}
            {user ? (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.5,
                    delay: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  },
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                viewport={{ once: false }}
              >
                <PrimaryButton
                  className="bg-secondary hover:bg-secondary/90 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  onClick={() => {
                    // Navigate to commitments page or open modal if commitments are managed via modal
                    // For now, let's just log a message or open a placeholder modal
                    alert("Viewing my commitments!");
                  }}
                >
                  View My Commitments
                </PrimaryButton>
              </motion.div>
            ) : (
              <motion.div
                className="bg-muted rounded-xl p-8 mb-8"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.5,
                    delay: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  },
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                viewport={{ once: false }}
              >
                <motion.h3
                  className="text-2xl font-montserrat font-semibold mb-4 text-primary"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.4, delay: 0.6 },
                  }}
                  viewport={{ once: false }}
                >
                  My Commitments
                </motion.h3>

                <motion.p
                  className="text-muted-foreground mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.4, delay: 0.7 },
                  }}
                  viewport={{ once: false }}
                >
                  Sign in to view and manage your volunteer commitments
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.4, delay: 0.8 },
                  }}
                  viewport={{ once: false }}
                >
                  <PrimaryButton
                    className="bg-secondary hover:bg-secondary/90 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={handleLoginClick}
                  >
                    Log In
                  </PrimaryButton>
                </motion.div>
              </motion.div>
            )}
          </AnimatedSection>
        </div>
      </div>
      
      {/* User Authentication Modal */}
      <UserAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleCloseAuthModal} 
      />
    </section>
  );
};

export default CallToActionSection;