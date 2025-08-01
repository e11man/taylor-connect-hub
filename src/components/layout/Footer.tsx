import { Heart } from "lucide-react";
import AnimatedSection from "@/components/ui/animated-section";
import { motion } from "framer-motion";
import { DynamicText } from "@/components/content/DynamicText";
import { useContentSection } from "@/hooks/useContent";
import tuLogo from "@/assets/tu_logo.png";

const Footer = () => {
  const { content: linksContent } = useContentSection('footer', 'links');
  const { content: brandContent } = useContentSection('footer', 'brand');
  const { content: copyrightContent } = useContentSection('footer', 'copyright');
  const { content: partnershipContent } = useContentSection('footer', 'partnership');
  
  const footerLinks = [
    { name: linksContent.about || "About", href: "/about" },
    { name: linksContent.contact || "Contact", href: "#contact" },
    { name: linksContent.opportunities || "Opportunities", href: "#opportunities" },
    { name: linksContent.privacy || "Privacy", href: "#" },
    { name: linksContent.terms || "Terms", href: "#" }
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <AnimatedSection variant="fade" delay={0.1}>
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
                <DynamicText 
                  page="footer" 
                  section="brand" 
                  contentKey="name"
                  fallback="Community Connect"
                  as="span"
                />
              </span>
            </motion.div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6">
              {footerLinks.map((link, index) => (
                <motion.a
                  key={link.href}
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
                      duration: 0.3, 
                      delay: index * 0.05 + 0.2 
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
                transition: { duration: 0.4, delay: 0.4 }
              }}
              viewport={{ once: false }}
            >
              <DynamicText 
                page="footer" 
                section="copyright" 
                contentKey="text"
                fallback="© 2024 Community Connect"
                as="span"
              />
            </motion.p>
          </div>

          {/* Partnership note with Taylor University logo */}
          <motion.div 
            className="text-center mt-4 pt-4 border-t border-gray-100"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.4, delay: 0.5 }
            }}
            viewport={{ once: false }}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs text-muted-foreground font-montserrat">
                {partnershipContent.text || "In partnership with"}
              </span>
              <motion.img
                src={tuLogo}
                alt={partnershipContent.partner_name || "Taylor University"}
                className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        </div>
      </AnimatedSection>
    </footer>
  );
};

export default Footer;