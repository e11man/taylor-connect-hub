import { useContentSection } from "@/hooks/useContent";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type OrganizationRow = Tables<'organizations'>;

const ProgramsSection = () => {
  const { content: programsContent } = useContentSection('about', 'programs');

  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const rotationIntervalRef = useRef<number | null>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      // Only show approved organizations to the public
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
      setErrorMessage(err.message || 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();

    // Real-time updates so new orgs appear automatically
    const channel = supabase
      .channel('organizations_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, () => fetchOrganizations())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrganizations]);

  // Auto-rotate visible organizations in groups of three
  useEffect(() => {
    if (organizations.length <= 3) return; // Nothing to rotate

    const startRotation = () => {
      stopRotation();
      rotationIntervalRef.current = window.setInterval(() => {
        setStartIndex((prev) => (prev + 3) % organizations.length);
      }, 5000);
    };

    const stopRotation = () => {
      if (rotationIntervalRef.current !== null) {
        window.clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };

    if (!isHovered) {
      startRotation();
    } else {
      stopRotation();
    }

    return () => stopRotation();
  }, [organizations.length, isHovered]);

  const visibleOrganizations = useMemo(() => {
    if (organizations.length <= 3) return organizations;
    const end = startIndex + 3;
    if (end <= organizations.length) {
      return organizations.slice(startIndex, end);
    }
    // Wrap-around to the beginning for remaining slots
    const firstPart = organizations.slice(startIndex);
    const secondPart = organizations.slice(0, end - organizations.length);
    return [...firstPart, ...secondPart];
  }, [organizations, startIndex]);

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
      scale: 1
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
          variants={containerVariants}
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
        </motion.div>

        {/* Organizations Rotating Grid (3 at a time) */}
        <div 
          className="max-w-7xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0,1,2].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-8 border-2 border-gray-200 animate-pulse h-[220px]" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="text-center text-red-600">{errorMessage}</div>
          ) : organizations.length === 0 ? (
            <div className="text-center text-muted-foreground">No partner organizations yet. Check back soon!</div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {visibleOrganizations.map((org) => (
                <motion.div 
                  key={org.id}
                  variants={itemVariants}
                  className="group bg-white rounded-3xl p-6 md:p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300"
                >
                  <h3 className="text-xl md:text-2xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                    {org.name}
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
                        className="text-[#00AFCE] font-medium hover:underline"
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