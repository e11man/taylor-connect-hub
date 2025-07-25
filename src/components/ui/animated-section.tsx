import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: "slideUp" | "slideLeft" | "slideRight" | "fade" | "scale" | "stagger";
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = "", 
  delay = 0, 
  duration = 0.6,
  variant = "slideUp" 
}) => {
  const getVariants = () => {
    const baseTransition = { duration, delay };
    
    switch (variant) {
      case 'slideUp':
        return {
          hidden: { opacity: 0, y: 40, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1, transition: baseTransition }
        };
      case 'slideLeft':
        return {
          hidden: { opacity: 0, x: -40, scale: 0.95 },
          visible: { opacity: 1, x: 0, scale: 1, transition: baseTransition }
        };
      case 'slideRight':
        return {
          hidden: { opacity: 0, x: 40, scale: 0.95 },
          visible: { opacity: 1, x: 0, scale: 1, transition: baseTransition }
        };
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { ...baseTransition, ease: "easeOut" } }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1, transition: baseTransition }
        };
      case 'stagger':
        return {
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
              delayChildren: delay
            }
          }
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: baseTransition }
        };
    }
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ 
        once: false,
        amount: 0.2,
        margin: "-30px"
      }}
      variants={getVariants()}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;