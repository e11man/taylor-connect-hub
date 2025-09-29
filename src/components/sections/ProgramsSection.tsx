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
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);

  const fetchOrganizations = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setErrorMessage(null);
      console.log('Fetching organizations from Supabase...');
      
      // Only show approved organizations to the public
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase error, using fallback data:', error);
        throw error;
      }
      
      if (!mountedRef.current) return;
      
      const orgs = data || [];
      console.log(`Loaded ${orgs.length} organizations from database`);
      
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
      console.log('No organizations available');
      setDisplayedOrgs([]);
      return;
    }

    if (allOrganizations.length <= 3) {
      console.log(`Showing all ${allOrganizations.length} organizations (no rotation needed)`);
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
    
    console.log(`Rotation set ${currentSet}: showing organizations ${startIndex}-${endIndex-1} of ${allOrganizations.length}`);
    setDisplayedOrgs(newDisplayed);
  }, [allOrganizations, currentSet]);

  useEffect(() => {
    fetchOrganizations();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchOrganizations]);

  // Auto-rotate organizations when there are more than 3
  useEffect(() => {
    if (allOrganizations.length <= 3 || isHovered) {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
      return;
    }

    // Start rotation after initial delay
    const startRotation = () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
      
      rotationIntervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        setCurrentSet(prev => prev + 1);
      }, 8000); // 8 second intervals for better readability
    };

    const delayTimer = setTimeout(startRotation, 4000); // 4 second initial delay

    return () => {
      clearTimeout(delayTimer);
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };
  }, [allOrganizations.length, isHovered]);

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
            <motion.p 
              variants={descriptionVariants}
              className="text-sm text-muted-foreground mt-4 opacity-75"
            >
              Showing {Math.min(3, allOrganizations.length)} of {allOrganizations.length} organizations • New organizations appear automatically
            </motion.p>
          )}
        </motion.div>

        {/* Organizations Grid */}
        <div 
          className="max-w-7xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0,1,2].map((i) => (
                <div key={`loading-${i}`} className="bg-white rounded-3xl p-8 border-2 border-gray-200 animate-pulse h-[220px]" />
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {displayedOrgs.map((org, index) => (
                <motion.div 
                  key={`org-${org.id}`}
                  variants={itemVariants}
                  className="group bg-white rounded-3xl p-6 md:p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300"
                >
                  <h3 className="text-xl md:text-2xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                    {org.name || 'Unnamed Organization'}
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-montserrat line-clamp-4">
                    {org.description || 'No description provided.'}
                  </p>
                  {org.website && (
                    <div className="mt-4">
                      <a 
                        href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#00AFCE] font-medium hover:underline inline-block"
                      >
                        Visit website
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