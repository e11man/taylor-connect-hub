import { useContentSection } from "@/hooks/useContent";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type OrganizationRow = Tables<'organizations'>;

// Fallback organizations for when database is unavailable
const FALLBACK_ORGANIZATIONS: OrganizationRow[] = [
  {
    id: 'fallback-1',
    name: 'Community Food Bank',
    description: 'Providing nutritious food to families in need throughout our community. We serve over 500 families monthly and welcome volunteers.',
    website: 'https://communityfoodbank.org',
    contact_email: 'info@communityfoodbank.org',
    phone: '(555) 123-4567',
    status: 'approved',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    approved_at: '2024-01-01T00:00:00Z',
    approved_by: 'admin',
    email_confirmed: true,
    user_id: 'fallback-user'
  },
  {
    id: 'fallback-2',
    name: 'Youth Mentorship Program',
    description: 'Connecting local youth with caring adult mentors to build lasting relationships and provide guidance for academic and personal success.',
    website: 'https://youthmentors.org',
    contact_email: 'connect@youthmentors.org',
    phone: '(555) 987-6543',
    status: 'approved',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    approved_at: '2024-01-02T00:00:00Z',
    approved_by: 'admin',
    email_confirmed: true,
    user_id: 'fallback-user'
  },
  {
    id: 'fallback-3',
    name: 'Senior Care Network',
    description: 'Supporting our elderly community members with transportation, meal delivery, and companionship services to help them age in place.',
    website: 'https://seniorcarenetwork.org',
    contact_email: 'help@seniorcarenetwork.org',
    phone: '(555) 456-7890',
    status: 'approved',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    approved_at: '2024-01-03T00:00:00Z',
    approved_by: 'admin',
    email_confirmed: true,
    user_id: 'fallback-user'
  }
];

const ProgramsSection = () => {
  const { content: programsContent } = useContentSection('about', 'programs');

  const [allOrganizations, setAllOrganizations] = useState<OrganizationRow[]>([]);
  const [displayedOrgs, setDisplayedOrgs] = useState<OrganizationRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentSet, setCurrentSet] = useState<number>(0);
  const mountedRef = useRef<boolean>(true);

  const fetchOrganizations = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setErrorMessage(null);
      
      // Only show approved organizations to the public
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      if (!mountedRef.current) return;
      
      const orgs = data || [];
      
      // Use database organizations if available, otherwise fallback
      const organizationsToUse = orgs.length > 0 ? orgs : FALLBACK_ORGANIZATIONS;
      setAllOrganizations(organizationsToUse);
      
      // Set initial displayed organizations (first 3 or all if less)
      setDisplayedOrgs(organizationsToUse.slice(0, Math.min(3, organizationsToUse.length)));
      setCurrentSet(0);
      
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error('Failed to load organizations, using fallback data:', err);
      
      // Use fallback organizations on error
      setAllOrganizations(FALLBACK_ORGANIZATIONS);
      setDisplayedOrgs(FALLBACK_ORGANIZATIONS.slice(0, Math.min(3, FALLBACK_ORGANIZATIONS.length)));
      setCurrentSet(0);
      setErrorMessage('Using sample organizations (database connection issue)');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Update displayed organizations when currentSet changes
  useEffect(() => {
    if (allOrganizations.length === 0) {
      setDisplayedOrgs([]);
      return;
    }

    if (allOrganizations.length <= 3) {
      setDisplayedOrgs(allOrganizations);
      return;
    }

    const startIndex = (currentSet * 3) % allOrganizations.length;
    const endIndex = startIndex + 3;
    
    let newDisplayed: OrganizationRow[];
    if (endIndex <= allOrganizations.length) {
      newDisplayed = allOrganizations.slice(startIndex, endIndex);
    } else {
      // Wrap around to beginning
      const firstPart = allOrganizations.slice(startIndex);
      const secondPart = allOrganizations.slice(0, endIndex - allOrganizations.length);
      newDisplayed = [...firstPart, ...secondPart];
    }
    
    setDisplayedOrgs(newDisplayed);
  }, [allOrganizations, currentSet]);

  useEffect(() => {
    fetchOrganizations();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchOrganizations]);

  // Calculate total number of sets
  const totalSets = Math.ceil(allOrganizations.length / 3);
  
  // Navigation functions
  const goToNextSet = () => {
    setCurrentSet(prev => (prev + 1) % totalSets);
  };
  
  const goToPrevSet = () => {
    setCurrentSet(prev => (prev - 1 + totalSets) % totalSets);
  };
  
  const goToSet = (setIndex: number) => {
    setCurrentSet(setIndex);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (totalSets <= 1) return;
      
      // Only handle arrow keys when focus is within the organizations section
      const organizationsSection = document.getElementById('programs');
      if (!organizationsSection?.contains(document.activeElement)) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevSet();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextSet();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSets]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const titleVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      filter: "blur(8px)"
    },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)"
    }
  };

  const descriptionVariants = {
    hidden: { 
      opacity: 0, 
      y: 15
    },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <section id="programs" className="bg-white section-padding">
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1
              }
            }
          }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          {/* Section Header */}
          <motion.h2 
            variants={titleVariants}
            className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary"
          >
            {programsContent.title || 'Local Programs & Organizations'}
          </motion.h2>
          
          <motion.p 
            variants={descriptionVariants}
            className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-4xl mx-auto"
          >
            {programsContent.description || 'Discover local organizations partnering through Community Connect. As new organizations sign up, they will appear here with a short description.'}
          </motion.p>
          
          {allOrganizations.length > 3 && (
            <motion.div 
              variants={descriptionVariants}
              className="mt-6"
            >
              
              {/* Mobile-Optimized Navigation Controls */}
              <div className="flex flex-col items-center gap-4">
                {/* Dot indicators - Mobile First */}
                <div className="flex gap-4 px-2">
                  {Array.from({ length: totalSets }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSet(index)}
                      className={`w-6 h-6 sm:w-4 sm:h-4 rounded-full transition-all duration-300 touch-manipulation ${
                        index === currentSet 
                          ? 'bg-[#00AFCE] scale-125 shadow-lg ring-2 ring-[#00AFCE] ring-opacity-30' 
                          : 'bg-gray-300 hover:bg-gray-400 hover:scale-110 active:scale-95'
                      }`}
                      aria-label={`Go to organization set ${index + 1}`}
                    />
                  ))}
                </div>
                
                {/* Previous/Next Buttons - Larger touch targets on mobile */}
                <div className="flex items-center gap-3 sm:gap-6">
                  <button
                    onClick={goToPrevSet}
                    disabled={totalSets <= 1}
                    className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-3 rounded-xl bg-white border-2 border-gray-200 hover:border-[#00AFCE] hover:text-[#00AFCE] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-sm hover:shadow-md active:scale-95 touch-manipulation min-h-[48px]"
                    aria-label="Previous organizations"
                  >
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  
                  <button
                    onClick={goToNextSet}
                    disabled={totalSets <= 1}
                    className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-3 rounded-xl bg-white border-2 border-gray-200 hover:border-[#00AFCE] hover:text-[#00AFCE] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-sm hover:shadow-md active:scale-95 touch-manipulation min-h-[48px]"
                    aria-label="Next organizations"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Organizations Grid */}
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[0,1,2].map((i) => (
                <div key={`loading-${i}`} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 animate-pulse h-[200px] sm:h-[220px]" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="text-center text-red-600 p-8">
              <p className="text-lg mb-4">{errorMessage}</p>
              <button 
                onClick={fetchOrganizations}
                className="px-4 py-2 bg-[#00AFCE] text-white rounded-lg hover:bg-[#008fb0] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : allOrganizations.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <p className="text-lg">No partner organizations yet. Check back soon!</p>
            </div>
          ) : (
            <motion.div
              key={`orgs-${currentSet}`}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {displayedOrgs.map((org, index) => (
                <motion.div 
                  key={`org-${org.id}`}
                  variants={itemVariants}
                  className="group bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg active:scale-[0.98] transition-all duration-300 touch-manipulation"
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl font-montserrat font-bold mb-2 sm:mb-3 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                    {org.name || 'Unnamed Organization'}
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-montserrat line-clamp-3 sm:line-clamp-4 mb-3 sm:mb-4">
                    {org.description || 'No description provided.'}
                  </p>
                  {org.website && (
                    <div className="mt-auto">
                      <a 
                        href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#00AFCE] font-medium hover:underline active:scale-95 transition-transform duration-200 touch-manipulation py-2"
                      >
                        <span>Visit website</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;