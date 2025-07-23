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
    <footer className="bg-gradient-to-b from-background to-primary/5 border-t border-border/50">
      <div className="container-ocean py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">Community Connect</h3>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              Connecting communities through meaningful volunteer opportunities. 
              Making a positive impact, one volunteer at a time.
            </p>

            {/* Partnership Badge */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl border border-accent/20">
              <div className="text-sm">
                <span className="font-medium text-primary">In partnership with</span>
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center mt-1">
                  <span className="text-white font-bold text-xs">TU</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-primary mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-muted-foreground hover:text-accent transition-ocean"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-primary mb-6">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-muted-foreground hover:text-accent transition-ocean"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-t border-border/50 mb-8">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-accent" />
            <span className="text-muted-foreground">hello@communityconnect.org</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-accent" />
            <span className="text-muted-foreground">(555) 123-4567</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-accent" />
            <span className="text-muted-foreground">Upland, CA 91784</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2024 Community Connect. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-accent transition-ocean">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-ocean">
                Terms of Service
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-ocean">
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