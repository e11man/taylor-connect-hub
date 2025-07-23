import { useState } from "react";
import { Menu, X, Heart } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Opportunities", href: "#opportunities" },
    { name: "Contact", href: "#contact" }
  ];

  return (
    <header className="bg-primary shadow-sm sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-montserrat font-bold text-white">Community Connect</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-white hover:text-secondary transition-smooth font-medium font-montserrat"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <SecondaryButton variant="ghost" size="sm" className="text-white hover:bg-white/10">
              Log In
            </SecondaryButton>
            <PrimaryButton size="sm" className="bg-accent hover:bg-accent/90">
              Request Volunteers
            </PrimaryButton>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-smooth"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-primary border-t border-white/10 animate-slide-up">
            <div className="py-4 space-y-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-smooth font-medium font-montserrat"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-white/10">
                <SecondaryButton variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  Log In
                </SecondaryButton>
                <PrimaryButton size="sm" className="bg-accent hover:bg-accent/90">
                  Request Volunteers
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;