import { Heart, Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { useLocation } from "react-router-dom";
import AnimatedSection from "@/components/ui/animated-section";
import { motion } from "framer-motion";
import { DynamicText } from "@/components/content/DynamicText";
import { useContentSection } from "@/hooks/useContent";
import tuLogo from "@/assets/tu_logo.png";
import silentNightLogo from "@/assets/Tu-mainstreetmile-Silentnight-Full-Color-Rgb.svg";

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { content: linksContent } = useContentSection('footer', 'links');
  const { content: brandContent } = useContentSection('footer', 'brand');
  const { content: copyrightContent } = useContentSection('footer', 'copyright');
  const { content: partnershipContent } = useContentSection('footer', 'partnership');
  const { content: socialContent } = useContentSection('footer', 'social');
  
  const footerLinks = [
    { name: linksContent.about || <DynamicText page="footer" section="links" contentKey="about" fallback=<DynamicText page="footer" section="links" contentKey="about_link" fallback=<DynamicText page="header" section="nav" contentKey="about" fallback=<DynamicText page="header" section="nav" contentKey="about_link" fallback="About" /> /> /> />, href: "/about" },
    { name: linksContent.contact || <DynamicText page="footer" section="links" contentKey="contact" fallback=<DynamicText page="footer" section="links" contentKey="contact_link" fallback=<DynamicText page="header" section="nav" contentKey="contact" fallback=<DynamicText page="header" section="nav" contentKey="contact_link" fallback="Contact" /> /> /> />, href: isHomePage ? "#contact" : "/#contact" },
    { name: linksContent.privacy || "Privacy", href: "/privacy" },
    { name: linksContent.terms || "Terms", href: "/terms" }
  ];

  const socialMediaLinks = [
    {
      icon: Facebook,
      url: socialContent.facebook_url || "https://www.facebook.com/TaylorUniversity",
      label: socialContent.facebook_label || <DynamicText page="footer" section="social" contentKey="facebook_label" fallback=<DynamicText page="footer" section="social" contentKey="facebook" fallback="Facebook" /> />,
      color: "hover:bg-blue-600",
      hidden: socialContent.facebook_hidden === 'true'
    },
    {
      icon: Instagram,
      url: socialContent.instagram_url || <DynamicText page="footer" section="social" contentKey="instagram_url" fallback="https://www.instagram.com/tayloruniversity" />,
      label: socialContent.instagram_label || <DynamicText page="footer" section="social" contentKey="instagram_label" fallback=<DynamicText page="footer" section="social" contentKey="instagram" fallback="Instagram" /> />,
      color: "hover:bg-gradient-to-r from-purple-500 to-pink-500",
      hidden: socialContent.instagram_hidden === 'true'
    },
    {
      icon: Twitter,
      url: socialContent.twitter_url || <DynamicText page="footer" section="social" contentKey="twitter_url" fallback="https://twitter.com/TaylorU" />,
      label: socialContent.twitter_label || <DynamicText page="footer" section="social" contentKey="twitter_label" fallback=<DynamicText page="footer" section="social" contentKey="twitter" fallback="Twitter" /> />,
      color: "hover:bg-blue-400",
      hidden: socialContent.twitter_hidden === 'true'
    },
    {
      icon: Linkedin,
      url: socialContent.linkedin_url || <DynamicText page="footer" section="social" contentKey="linkedin_url" fallback="https://www.linkedin.com/school/taylor-university" />,
      label: socialContent.linkedin_label || <DynamicText page="footer" section="social" contentKey="linkedin_label" fallback=<DynamicText page="footer" section="social" contentKey="linkedin" fallback="LinkedIn" /> />,
      color: "hover:bg-blue-700",
      hidden: socialContent.linkedin_hidden === 'true'
    },
    {
      icon: Youtube,
      url: socialContent.youtube_url || <DynamicText page="footer" section="social" contentKey="youtube_url" fallback="https://www.youtube.com/user/TaylorUniversity" />,
      label: socialContent.youtube_label || <DynamicText page="footer" section="social" contentKey="youtube_label" fallback="YouTube" />,
      color: "hover:bg-red-600",
      hidden: socialContent.youtube_hidden === 'true'
    }
  ].filter(social => !social.hidden); // Filter out hidden platforms

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
              <img 
                src={silentNightLogo}
                alt="Silent Night Logo"
                className="w-8 h-8 rounded-xl object-contain"
              />
              <span className="text-lg font-montserrat font-bold text-primary">
                <DynamicText 
                  page="footer" 
                  section="brand" 
                  contentKey="name"
                  fallback=<DynamicText page="footer" section="brand" contentKey="name" fallback=<DynamicText page="header" section="brand" contentKey="name" fallback="Community Connect" /> />
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

          {/* Social Media Section */}
          {socialMediaLinks.length > 0 && (
            <div className="text-center mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-montserrat font-semibold text-primary mb-4">
                {socialContent.title || <DynamicText page="footer" section="social" contentKey="title" fallback="Follow Us" />}
              </h3>
              
              <div className="flex justify-center items-center gap-3">
                {socialMediaLinks.map((social, index) => (
                  <motion.a
                    key={`social-${index}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      w-10 h-10 rounded-xl flex items-center justify-center 
                      bg-gray-100 hover:bg-[#00AFCE] transition-all duration-300 
                      group relative overflow-hidden
                      ${social.color}
                    `}
                    whileHover={{ 
                      scale: 1.1,
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: { 
                        duration: 0.3, 
                        delay: 0.7 + index * 0.1 
                      }
                    }}
                    viewport={{ once: false }}
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
                    
                    {/* Tooltip */}
                    <motion.div
                      className="absolute -top-10 left-1/2 transform -translate-x-1/2 
                                 bg-gray-800 text-white text-xs px-2 py-1 rounded 
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                 pointer-events-none whitespace-nowrap z-10"
                      initial={{ opacity: 0, y: 5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {social.label}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </motion.div>
                  </motion.a>
                ))}
              </div>
            </div>
          )}

          {/* Partnership note with Taylor University logo */}
          <motion.div 
            className="text-center mt-4 pt-4 border-t border-gray-100"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.4, delay: 0.8 }
            }}
            viewport={{ once: false }}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs text-muted-foreground font-montserrat">
                {partnershipContent.text || "In partnership with"}
              </span>
              <motion.img
                src={tuLogo}
                alt={partnershipContent.partner_name || <DynamicText page="footer" section="partnership" contentKey="partner_name" fallback="Taylor University" />}
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