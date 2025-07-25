import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: "slideUp" | "slideLeft" | "slideRight" | "fade" | "scale" | "stagger";
}

const variants = {
  slideUp: {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    }
  },
  slideLeft: {
    hidden: { 
      opacity: 0, 
      x: -60,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    }
  },
  slideRight: {
    hidden: { 
      opacity: 0, 
      x: 60,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    }
  },
  fade: {
    hidden: { 
      opacity: 0,
    },
    visible: { 
      opacity: 1,
      transition: {
        duration: 1.0,
        ease: "easeOut",
      }
    }
  },
  scale: {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    }
  },
  stagger: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  }
};

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = "", 
  delay = 0, 
  duration,
  variant = "slideUp" 
}) => {
  const motionVariant = { ...variants[variant] };
  
  // Apply custom duration if provided
  if (duration && motionVariant.visible?.transition) {
    motionVariant.visible.transition.duration = duration;
  }
  
  // Apply custom delay if provided
  if (delay > 0 && motionVariant.visible?.transition) {
    motionVariant.visible.transition.delay = delay;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ 
        once: false, // This ensures animations trigger every time
        amount: 0.2, // Trigger when 20% of element is visible
        margin: "-50px" // Start animation 50px before element comes into view
      }}
      variants={motionVariant}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;