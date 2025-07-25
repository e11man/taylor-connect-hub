import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "slideUp" | "fade" | "typewriter" | "blur";
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  children, 
  className = "", 
  delay = 0, 
  variant = "slideUp",
  as: Component = "div"
}) => {
  const getVariants = (): Variants => {
    switch (variant) {
      case 'slideUp':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.5, delay } 
          }
        };
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1, 
            transition: { duration: 0.6, delay } 
          }
        };
      case 'typewriter':
        return {
          hidden: { opacity: 0, width: 0 },
          visible: { 
            opacity: 1, 
            width: "auto", 
            transition: { duration: 0.8, delay } 
          }
        };
      case 'blur':
        return {
          hidden: { opacity: 0, filter: "blur(8px)", y: 15 },
          visible: { 
            opacity: 1, 
            filter: "blur(0px)", 
            y: 0, 
            transition: { duration: 0.6, delay } 
          }
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1, 
            transition: { duration: 0.6, delay } 
          }
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
        amount: 0.3,
        margin: "-20px"
      }}
      variants={getVariants()}
    >
      <Component className={Component !== "div" ? className : ""}>
        {children}
      </Component>
    </motion.div>
  );
};

export default AnimatedText;