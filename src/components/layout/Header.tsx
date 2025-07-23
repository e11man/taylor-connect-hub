import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const NAV_LINKS = [
    { name: "Home", href: "/", isRoute: true },
    { name: "About", href: isHomePage ? "#about" : "/about", isRoute: !isHomePage },
    { name: "Opportunities", href: isHomePage ? "#opportunities" : "/#opportunities", isRoute: false },
    { name: "Contact", href: isHomePage ? "#contact" : "/#contact", isRoute: false }
  ];

  // Lock scroll when mobile nav is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Trap focus inside mobile nav when open (accessibility)
  useEffect(() => {
    if (!mobileOpen) return;
    const focusableSelectors =
      'a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusableEls = navRef.current
      ? navRef.current.querySelectorAll(focusableSelectors)
      : [];
    if (focusableEls.length) {
      (focusableEls[0] as HTMLElement).focus();
    }
    const handleTab = (e: KeyboardEvent) => {
      if (!mobileOpen) return;
      const firstEl = focusableEls[0] as HTMLElement;
      const lastEl = focusableEls[focusableEls.length - 1] as HTMLElement;
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [mobileOpen]);

  const MobileMenuButton = ({ isOpen, toggleMenu }: { isOpen: boolean; toggleMenu: () => void }) => (
     <button
       aria-label={isOpen ? 'Close menu' : 'Open menu'}
       onClick={toggleMenu}
       className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00AFCE] transition"
       type="button"
     >
       <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
       <div className="relative w-6 h-6">
         <span
           className={`block absolute h-0.5 w-6 bg-gray-700 transform transition duration-300 ease-in-out ${
             isOpen ? 'rotate-45 top-3' : 'top-1'
           }`}
         />
         <span
           className={`block absolute h-0.5 w-6 bg-gray-700 transition-all duration-300 ease-in-out ${
             isOpen ? 'opacity-0' : 'opacity-100 top-3'
           }`}
         />
         <span
           className={`block absolute h-0.5 w-6 bg-gray-700 transform transition duration-300 ease-in-out ${
             isOpen ? '-rotate-45 top-3' : 'top-5'
           }`}
         />
       </div>
     </button>
   );

  const MobileNav = ({ isOpen, navLinks, closeMenu }: { isOpen: boolean; navLinks: typeof NAV_LINKS; closeMenu: () => void }) => (
    <aside
      ref={navRef}
      className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeMenu}
      />
      {/* Drawer */}
      <nav
        className={`absolute top-0 right-0 h-full w-4/5 max-w-xs shadow-2xl flex flex-col pt-8 pb-10 px-7 transition-transform duration-300 rounded-l-2xl bg-white border-l border-gray-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          className="self-end mb-6 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition shadow"
          aria-label="Close menu"
          onClick={closeMenu}
          tabIndex={isOpen ? 0 : -1}
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l16 16M6 22L22 6" />
          </svg>
        </button>
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 mb-10 font-bold text-primary text-xl tracking-tight"
          onClick={closeMenu}
          tabIndex={isOpen ? 0 : -1}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: '#00AFCE'}}>
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-montserrat">Community Connect</span>
        </Link>
        {/* Nav links */}
        <ul className="flex flex-col gap-3 mb-10">
          {navLinks.map((link) => (
            <li key={link.name}>
              {link.isRoute ? (
                <Link
                  to={link.href}
                  className="block px-4 py-3 rounded-xl font-medium text-base transition-colors duration-200 text-gray-700 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none font-montserrat"
                  onClick={closeMenu}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="block px-4 py-3 rounded-xl font-medium text-base transition-colors duration-200 text-gray-700 hover:bg-gray-100 focus:bg-gray-200 focus:outline-none font-montserrat"
                  onClick={closeMenu}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {link.name}
                </a>
              )}
            </li>
          ))}
        </ul>
        {/* CTA Button */}
        <PrimaryButton
          onClick={() => {
            closeMenu();
          }}
          className="w-full py-3 text-base font-semibold shadow-md hover:shadow-lg rounded-xl"
        >
          Request Volunteers
        </PrimaryButton>
        <div className="flex-1" />
        {/* Footer */}
        <div className="mt-10 text-xs text-gray-500 text-center">
          &copy; {new Date().getFullYear()} Community Connect
        </div>
      </nav>
    </aside>
  );

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 font-montserrat shadow-sm"
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 font-bold text-gray-900 text-lg md:text-xl tracking-tight">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{backgroundColor: '#00AFCE'}}>
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline text-base md:text-xl font-montserrat">Community Connect</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex gap-6">
            {NAV_LINKS.map(link => (
              <li key={link.name}>
                {link.isRoute ? (
                  <Link
                    to={link.href}
                    className="relative px-2 py-1 text-gray-600 hover:text-[#00AFCE] font-medium transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-[#00AFCE] after:transition-all after:duration-300 hover:after:w-full font-montserrat"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="relative px-2 py-1 text-gray-600 hover:text-[#00AFCE] font-medium transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-[#00AFCE] after:transition-all after:duration-300 hover:after:w-full font-montserrat"
                  >
                    {link.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <PrimaryButton
            className="ml-4 shadow-sm hover:shadow-md whitespace-nowrap text-white"
            style={{backgroundColor: '#E14F3D', borderColor: '#E14F3D'}}
            onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#C73E2F'}}
            onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = '#E14F3D'}}
          >
            Request Volunteers
          </PrimaryButton>
        </nav>

        {/* Mobile: CTA + Hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <PrimaryButton
            className="text-xs px-3 py-2 shadow-sm rounded-lg font-medium transition-all duration-300 hover:shadow-md active:scale-95 whitespace-nowrap text-white"
            style={{backgroundColor: '#E14F3D', borderColor: '#E14F3D'}}
            onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#C73E2F'}}
            onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = '#E14F3D'}}
          >
            Request Volunteers
          </PrimaryButton>
          <MobileMenuButton isOpen={mobileOpen} toggleMenu={() => setMobileOpen(v => !v)} />
        </div>
      </div>
      <MobileNav
        isOpen={mobileOpen}
        navLinks={NAV_LINKS}
        closeMenu={() => setMobileOpen(false)}
      />
    </header>
  );
};

export default Header;