import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import CallToActionSection from "@/components/sections/CallToActionSection";
import SearchSection from "@/components/sections/SearchSection";
import OpportunitiesSection from "@/components/sections/OpportunitiesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import ContactSection from "@/components/sections/ContactSection";
import UserDashboard from "@/components/sections/UserDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { ContentDebugger } from "@/components/debug/ContentDebugger";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        {user ? (
          <>
            <UserDashboard />
            <div id="search">
              <SearchSection />
            </div>
            <div id="opportunities">
              <OpportunitiesSection />
            </div>
          </>
        ) : (
          <>
            <CallToActionSection />
            <div id="search">
              <SearchSection />
            </div>
            <div id="opportunities">
              <OpportunitiesSection />
            </div>
            <TestimonialsSection />
            <ContactSection />
          </>
        )}
      </main>
      <Footer />
      
      {/* Temporary debug component - remove in production */}
      <ContentDebugger />
    </div>
  );
};

export default Index;