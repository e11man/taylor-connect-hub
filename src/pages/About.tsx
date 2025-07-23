import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AboutHeroSection from "@/components/sections/AboutHeroSection";
import MissionSection from "@/components/sections/MissionSection";
import ImpactSection from "@/components/sections/ImpactSection";
import WhatWeDoSection from "@/components/sections/WhatWeDoSection";
import ProgramsSection from "@/components/sections/ProgramsSection";
import ContactSection from "@/components/sections/ContactSection";

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <AboutHeroSection />
        <MissionSection />
        <ImpactSection />
        <WhatWeDoSection />
        <ProgramsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default About;