import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import logo from "@/assets/logo.svg";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import RequestVolunteersModal from "@/components/modals/RequestVolunteersModal";
import UserAuthModal from "@/components/modals/UserAuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { DynamicText } from "@/components/content/DynamicText";
import { useContentSection } from "@/hooks/useContent";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { user, signOut } = useAuth();
  const { content: navContent } = useContentSection('header', 'nav');
  const { content: brandContent } = useContentSection('header', 'brand');
  const { content: buttonContent } = useContentSection('header', 'buttons');

  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const NAV_LINKS = [
    { name: navContent.home || "Home", href: "/", isRoute: true },
    { name: navContent.about || "About", href: "/about", isRoute: true },
    { name: navContent.opportunities || "Opportunities", href: isHomePage ? "#opportunities" : "/#opportunities", isRoute: false },
    { name: navContent.contact || "Contact", href: isHomePage ? "#contact" : "/#contact", isRoute: false }
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

  const MobileNav = ({ isOpen, navLinks, closeMenu }: { isOpen: boolean; navLinks: typeof NAV_LINKS; closeMenu: () => void }) => {
    const [hasInteracted, setHasInteracted] = useState(false);
    
    useEffect(() => {
      if (isOpen) setHasInteracted(true);
    }, [isOpen]);
    
    return (
      <aside
        ref={navRef}
        className={`fixed inset-0 z-[100] md:hidden ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ease-out ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMenu}
        />
        {/* Drawer */}
        <nav
          className={`fixed inset-y-0 right-0 w-4/5 max-w-xs shadow-2xl flex flex-col pt-8 pb-10 px-7 bg-white border-l border-gray-200 rounded-l-2xl ${
            !hasInteracted ? 'translate-x-full opacity-0' : 
            isOpen ? 'animate-slide-in-right' : 'animate-slide-out-right'
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
            <img src={logo} alt="Community Connect Logo" className="h-12 w-auto" />
            <span className="text-lg font-montserrat">
              <DynamicText 
                page="header" 
                section="brand" 
                contentKey="name"
                fallback="Community Connect"
                as="span"
              />
            </span>
          </Link>
          {/* Nav links */}
          <ul className="flex flex-col gap-3 mb-10">
            {navLinks.map((link) => (
              <li key={link.href}>
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
          {/* Auth/CTA Button */}
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <User className="w-4 h-4 text-[#00AFCE]" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {user.email}
                </span>
              </div>
              <PrimaryButton
                onClick={() => {
                  closeMenu();
                  setModalOpen(true);
                }}
                className="w-full"
              >
                <DynamicText 
                  page="header" 
                  section="buttons" 
                  contentKey="requestVolunteers"
                  fallback="Request Volunteers"
                  as="span"
                />
              </PrimaryButton>
              <button
                onClick={() => {
                  closeMenu();
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-base font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <DynamicText 
                  page="header" 
                  section="buttons" 
                  contentKey="signOut"
                  fallback="Sign Out"
                  as="span"
                />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <SecondaryButton
                onClick={() => {
                  closeMenu();
                  setAuthModalOpen(true);
                }}
                className="w-full py-3 text-base font-semibold shadow-md hover:shadow-lg rounded-xl"
              >
                <DynamicText 
                  page="header" 
                  section="buttons" 
                  contentKey="login"
                  fallback="Log in"
                  as="span"
                />
              </SecondaryButton>
              <PrimaryButton
                onClick={() => {
                  closeMenu();
                  setModalOpen(true);
                }}
                className="w-full"
              >
                <DynamicText 
                  page="header" 
                  section="buttons" 
                  contentKey="requestVolunteers"
                  fallback="Request Volunteers"
                  as="span"
                />
              </PrimaryButton>
            </div>
          )}
          <div className="flex-1" />
          {/* Footer */}
          <div className="mt-10 text-xs text-gray-500 text-center">
            <DynamicText 
              page="footer" 
              section="copyright" 
              contentKey="text"
              fallback={`© ${new Date().getFullYear()} Community Connect`}
              as="span"
            />
          </div>
        </nav>
      </aside>
    );
  };

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 font-montserrat shadow-sm"
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 font-bold text-gray-900 text-lg md:text-xl tracking-tight">
          <img src={logo} alt="Community Connect Logo" className="w-12 h-12 rounded-lg object-contain" />
          <span className="hidden sm:inline text-base md:text-xl font-montserrat">
            <DynamicText 
              page="header" 
              section="brand" 
              contentKey="name"
              fallback="Community Connect"
              as="span"
            />
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex gap-6">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
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
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-[#00AFCE]" />
                  <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                    {user.email}
                  </span>
                </div>
                <PrimaryButton
                  onClick={() => setModalOpen(true)}
                  className="shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <DynamicText 
                    page="header" 
                    section="buttons" 
                    contentKey="requestVolunteers"
                    fallback="Request Volunteers"
                    as="span"
                  />
                </PrimaryButton>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#E14F3D] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <SecondaryButton
                  onClick={() => setAuthModalOpen(true)}
                  className="shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <DynamicText 
                    page="header" 
                    section="buttons" 
                    contentKey="login"
                    fallback="Log in"
                    as="span"
                  />
                </SecondaryButton>
                <PrimaryButton
                  onClick={() => setModalOpen(true)}
                  className="shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  <DynamicText 
                    page="header" 
                    section="buttons" 
                    contentKey="requestVolunteers"
                    fallback="Request Volunteers"
                    as="span"
                  />
                </PrimaryButton>
              </>
            )}
          </div>
        </nav>

        {/* Mobile: Auth/CTA + Hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {user ? (
            <PrimaryButton
              onClick={() => setModalOpen(true)}
              className="text-xs px-3 py-2 shadow-sm rounded-lg font-medium transition-all duration-300 hover:shadow-md active:scale-95 whitespace-nowrap"
            >
              <DynamicText 
                page="header" 
                section="buttons" 
                contentKey="requestVolunteers"
                fallback="Request Volunteers"
                as="span"
              />
            </PrimaryButton>
          ) : (
            <SecondaryButton
              onClick={() => setAuthModalOpen(true)}
              className="text-xs px-3 py-2 shadow-sm rounded-lg font-medium transition-all duration-300 hover:shadow-md active:scale-95 whitespace-nowrap"
            >
              <DynamicText 
                page="header" 
                section="buttons" 
                contentKey="login"
                fallback="Log in"
                as="span"
              />
            </SecondaryButton>
          )}
          <MobileMenuButton isOpen={mobileOpen} toggleMenu={() => setMobileOpen(v => !v)} />
        </div>
      </div>
      <MobileNav
        isOpen={mobileOpen}
        navLinks={NAV_LINKS}
        closeMenu={() => setMobileOpen(false)}
      />
      <RequestVolunteersModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="login"
      />
    </header>
  );
};

export default Header;