import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import CommunityTransitionImage from "@/components/sections/CommunityTransitionImage";
import MissionSection from "@/components/sections/MissionSection";
import OpportunitiesSection from "@/components/sections/OpportunitiesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import ContactSection from "@/components/sections/ContactSection";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState } from "react";
import UserAuthModal from "@/components/modals/UserAuthModal";

// Simple error boundary wrapper for debugging
const SectionWrapper: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error(`Error in ${name} section:`, error);
    return (
      <div className="p-8 text-center text-red-600">
        Error loading {name} section
      </div>
    );
  }
};

const Index = () => {
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-foreground">Loading Community Connect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SectionWrapper name="Header">
        <Header />
      </SectionWrapper>
      
      <main>
        <SectionWrapper name="HeroSection">
          <HeroSection />
        </SectionWrapper>
        <SectionWrapper name="CommunityTransitionImage">
          <CommunityTransitionImage />
        </SectionWrapper>
        <SectionWrapper name="MissionSection">
          <MissionSection />
        </SectionWrapper>
        <SectionWrapper name="OpportunitiesSection">
          <OpportunitiesSection />
        </SectionWrapper>
        <SectionWrapper name="TestimonialsSection">
          <TestimonialsSection setAuthModalOpen={setAuthModalOpen} />
        </SectionWrapper>
        <SectionWrapper name="ContactSection">
          <ContactSection />
        </SectionWrapper>
      </main>
      
      <SectionWrapper name="Footer">
        <Footer />
      </SectionWrapper>
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="signup"
      />
    </div>
  );
};

export default Index;