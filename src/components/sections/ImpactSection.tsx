import { Users, Clock, Building } from "lucide-react";
import { useContentSection } from "@/hooks/useContent";
import { useStatistics } from "@/hooks/useStatistics";

const ImpactSection = () => {
  const { content: impactContent, loading: impactLoading } = useContentSection('homepage', 'impact');
  const { statistics, loading: statsLoading } = useStatistics();
  
  const stats = [
    { 
      icon: Users, 
      label: impactContent.volunteers_label || "Active Volunteers", 
      value: statistics.active_volunteers,
      description: "Passionate individuals serving Upland"
    },
    { 
      icon: Clock, 
      label: impactContent.hours_label || "Hours Contributed", 
      value: statistics.hours_contributed,
      description: "Collective time dedicated to service"
    },
    { 
      icon: Building, 
      label: impactContent.organizations_label || "Partner Organizations", 
      value: statistics.partner_organizations,
      description: "Local organizations making a difference"
    }
  ];

  return (
    <section id="impact" className="bg-white section-padding">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Section Header */}
          <div className="animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
              Our Impact
            </h2>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="group relative bg-white border-2 border-gray-200 rounded-3xl p-8 md:p-10 text-center transition-all duration-500 hover:shadow-lg hover:scale-105 hover:border-[#00AFCE] overflow-hidden"
              style={{ animationDelay: `${0.5 + index * 0.1}s` }}
            >
              <div className="relative flex justify-center mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
              <div className="relative text-4xl md:text-5xl font-montserrat font-black mb-3 text-secondary group-hover:scale-110 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="relative text-lg md:text-xl font-montserrat font-bold mb-2 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                {stat.label}
              </div>
              <div className="relative text-sm md:text-base text-muted-foreground font-montserrat font-semibold leading-relaxed">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;