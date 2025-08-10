import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import MissionSection from "@/components/sections/MissionSection";
import OpportunitiesSection from "@/components/sections/OpportunitiesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import ContactSection from "@/components/sections/ContactSection";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState } from "react";
import UserAuthModal from "@/components/modals/UserAuthModal";

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
      <Header />
      
      <main>
        <HeroSection />
        <MissionSection />
        <OpportunitiesSection />
        <TestimonialsSection setAuthModalOpen={setAuthModalOpen} />
        <ContactSection />
      </main>
      
      <Footer />
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="signup"
      />
    </div>
  );
};

export default Index;