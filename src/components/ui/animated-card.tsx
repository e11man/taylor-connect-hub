import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  index?: number;
  variant?: "default" | "lift" | "tilt" | "glow";
}

const cardVariants = {
  default: {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.9 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    }
  }
};

const hoverVariants = {
  default: {
    scale: 1.02,
    y: -8,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  lift: {
    scale: 1.05,
    y: -12,
    rotateY: 5,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  tilt: {
    scale: 1.03,
    rotateZ: 2,
    y: -6,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  glow: {
    scale: 1.02,
    y: -8,
    filter: "brightness(1.1)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  className = "", 
  delay = 0, 
  index = 0,
  variant = "default" 
}) => {
  const cardDelay = delay + (index * 0.1);

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      whileHover={hoverVariants[variant]}
      viewport={{ 
        once: false,
        amount: 0.3,
        margin: "-30px"
      }}
      variants={{
        ...cardVariants.default,
        visible: {
          ...cardVariants.default.visible,
          transition: {
            ...cardVariants.default.visible.transition,
            delay: cardDelay
          }
        }
      }}
      style={{
        transformPerspective: 1000,
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;