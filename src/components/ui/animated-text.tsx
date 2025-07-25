import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "slideUp" | "fade" | "typewriter" | "blur";
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
}

const textVariants = {
  slideUp: {
    hidden: { 
      opacity: 0, 
      y: 30,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.7,
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
        duration: 0.8,
        ease: "easeOut",
      }
    }
  },
  typewriter: {
    hidden: { 
      opacity: 0,
      width: 0
    },
    visible: { 
      opacity: 1,
      width: "auto",
      transition: {
        duration: 1.2,
        ease: "easeOut",
      }
    }
  },
  blur: {
    hidden: { 
      opacity: 0,
      filter: "blur(8px)",
      y: 20
    },
    visible: { 
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration: 0.9,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    }
  }
};

const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  children, 
  className = "", 
  delay = 0, 
  variant = "slideUp",
  as: Component = "div"
}) => {
  const motionVariant = { ...textVariants[variant] };
  
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
        once: false,
        amount: 0.3,
        margin: "-30px"
      }}
      variants={motionVariant}
    >
      <Component className={Component !== "div" ? className : ""}>
        {children}
      </Component>
    </motion.div>
  );
};

export default AnimatedText;