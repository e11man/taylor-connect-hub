import { useState } from "react";
import communityGarden from "@/assets/community-garden.jpg";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import UserAuthModal from "@/components/modals/UserAuthModal";

const CallToActionSection = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Image */}
          <div className="animate-slide-in-left">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={communityGarden}
                alt="Volunteers working together in a community garden"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-primary/10"></div>
            </div>
          </div>

          {/* Content */}
          <div className="animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
              Join Our Community
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Be part of something bigger. Connect with like-minded volunteers 
              and make a meaningful impact in your local community.
            </p>
            
            {/* Sign In Section */}
            <div className="bg-muted rounded-xl p-8 mb-8">
              <h3 className="text-2xl font-montserrat font-semibold mb-4 text-primary">
                My Commitments
              </h3>
              <p className="text-muted-foreground mb-6">
                Sign in to view and manage your volunteer commitments
              </p>
              <PrimaryButton 
                className="bg-secondary hover:bg-secondary/90"
                onClick={handleLoginClick}
              >
                Log In
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Authentication Modal */}
      <UserAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleCloseAuthModal} 
      />
    </section>
  );
};

export default CallToActionSection;