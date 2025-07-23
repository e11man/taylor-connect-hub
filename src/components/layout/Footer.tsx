import { Heart, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    company: [
      { name: "About", href: "#about" },
      { name: "Contact", href: "#contact" },
      { name: "Opportunities", href: "#opportunities" },
      { name: "Organization Login", href: "#org-login" }
    ],
    support: [
      { name: "Supporting Upland", href: "#" },
      { name: "Creating Impact", href: "#" },
      { name: "Safety Guidelines", href: "#" },
      { name: "Help Center", href: "#" }
    ]
  };

  return (
    <footer className="bg-white border-t-2 border-gray-200">
      <div className="container-custom section-padding">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-montserrat font-bold text-primary">Community Connect</h3>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed font-montserrat">
              Connecting communities through meaningful volunteer opportunities. 
              Making a positive impact, one volunteer at a time.
            </p>

            {/* Partnership Badge */}
            <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">TU</span>
                </div>
                <div>
                  <span className="font-montserrat font-bold text-primary">In partnership with</span>
                  <p className="text-sm text-muted-foreground font-montserrat font-semibold">Taylor University</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-montserrat font-bold text-primary mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-muted-foreground hover:text-[#00AFCE] transition-all duration-300 font-montserrat font-semibold"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-montserrat font-bold text-primary mb-6 text-lg">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-muted-foreground hover:text-[#00AFCE] transition-all duration-300 font-montserrat font-semibold"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-t-2 border-gray-200 mb-8">
          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#00AFCE] rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-muted-foreground font-montserrat font-semibold group-hover:text-[#00AFCE] transition-all duration-300">hello@communityconnect.org</span>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#00AFCE] rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="text-muted-foreground font-montserrat font-semibold group-hover:text-[#00AFCE] transition-all duration-300">(555) 123-4567</span>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#00AFCE] rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="text-muted-foreground font-montserrat font-semibold group-hover:text-[#00AFCE] transition-all duration-300">Upland, CA 91784</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm font-montserrat font-semibold">
              © 2024 Community Connect. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-[#00AFCE] transition-all duration-300 font-montserrat font-semibold">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-[#00AFCE] transition-all duration-300 font-montserrat font-semibold">
                Terms of Service
              </a>
              <a href="#" className="text-muted-foreground hover:text-[#00AFCE] transition-all duration-300 font-montserrat font-semibold">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;