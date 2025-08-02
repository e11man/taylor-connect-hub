import { Heart, Globe, Users, HandHeart } from "lucide-react";
import { useContentSection } from "@/hooks/useContent";

const WhatWeDoSection = () => {
  const { content: whatWeDoContent } = useContentSection('about', 'what_we_do');
  
  const services = [
    {
      icon: Heart,
      title: whatWeDoContent.local_ministries_title || "Local Ministries",
      description: whatWeDoContent.local_ministries_description || "Taylor World Outreach (TWO) ministries provide hands-on opportunities to serve in our local Upland and beyond. These programs focus on meeting immediate needs while building lasting relationships."
    },
    {
      icon: Users,
      title: whatWeDoContent.community_plunge_title || "Community Plunge",
      description: whatWeDoContent.community_plunge_description || "Our signature immersive experience where volunteers dive deep into service in Upland, building connections and creating lasting impact through intensive, focused engagement."
    },
    {
      icon: Globe,
      title: whatWeDoContent.world_opportunities_title || "World Opportunities",
      description: whatWeDoContent.world_opportunities_description || "Learn about opportunities to serve globally, from short-term mission trips to long-term international partnerships that expand your impact beyond local borders."
    },
    {
      icon: HandHeart,
      title: whatWeDoContent.community_outreach_title || "Community Outreach Programs",
      description: whatWeDoContent.community_outreach_description || "Share the love of Christ through diverse service opportunities that address real needs in Upland and foster meaningful relationships."
    }
  ];

  return (
    <section id="what-we-do" className="bg-white section-padding">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Section Header */}
          <div className="animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
              {whatWeDoContent.title || 'What We Do'}
            </h2>
            
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-4xl mx-auto">
              {whatWeDoContent.description || 'Community Connect facilitates a wide array of volunteer opportunities, from local ministry work to global outreach initiatives. We partner with organizations that share our commitment to making a positive difference in Upland.'}
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div 
              key={service.title}
              className="group relative bg-white border-2 border-gray-200 rounded-3xl p-8 transition-all duration-500 hover:shadow-lg hover:scale-105 hover:border-[#00AFCE] animate-fade-in"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-montserrat">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDoSection;