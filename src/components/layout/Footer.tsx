import { Heart } from "lucide-react";
import AnimatedSection from "@/components/ui/animated-section";
import { motion } from "framer-motion";

const Footer = () => {
  const footerLinks = [
    { name: "About", href: "/about" },
    { name: "Contact", href: "#contact" },
    { name: "Opportunities", href: "#opportunities" },
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" }
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <AnimatedSection variant="fade" delay={0.2}>
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Brand */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 bg-[#00AFCE] rounded-xl flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-montserrat font-bold text-primary">
                Community Connect
              </span>
            </motion.div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6">
              {footerLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-[#00AFCE] transition-colors duration-300 font-montserrat font-medium"
                  whileHover={{ 
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      duration: 0.5, 
                      delay: index * 0.1 + 0.3 
                    }
                  }}
                  viewport={{ once: false }}
                >
                  {link.name}
                </motion.a>
              ))}
            </div>

            {/* Copyright */}
            <motion.p 
              className="text-sm text-muted-foreground font-montserrat"
              initial={{ opacity: 0 }}
              whileInView={{ 
                opacity: 1,
                transition: { duration: 0.6, delay: 0.8 }
              }}
              viewport={{ once: false }}
            >
              © 2024 Community Connect
            </motion.p>
          </div>

          {/* Partnership note */}
          <motion.div 
            className="text-center mt-4 pt-4 border-t border-gray-100"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.6, delay: 1.0 }
            }}
            viewport={{ once: false }}
          >
            <p className="text-xs text-muted-foreground font-montserrat">
              In partnership with Taylor University
            </p>
          </motion.div>
        </div>
      </AnimatedSection>
    </footer>
  );
};

export default Footer;