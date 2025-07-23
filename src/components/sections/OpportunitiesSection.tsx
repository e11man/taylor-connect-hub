import { Calendar, MapPin, Users, Star, ArrowRight } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";

const OpportunitiesSection = () => {
  const opportunities = [
    {
      id: 1,
      title: "Community Garden Project",
      description: "Help maintain and develop our community garden space for local residents.",
      category: "Environment",
      priority: "High Priority",
      date: "Jul 23",
      startTime: "12:30 PM",
      endTime: "4:00 PM",
      location: "1846 South Main Street, Upland...",
      volunteersNeeded: 6,
      volunteersSignedUp: 3,
      priorityColor: "bg-warning",
      categoryColor: "bg-success"
    },
    {
      id: 2,
      title: "Literacy Program Support",
      description: "Assist with reading programs for children and adults in our community center.",
      category: "Education", 
      priority: "High Priority",
      date: "Jul 23",
      startTime: "12:30 PM",
      endTime: "2:45 PM",
      location: "1846 South Main Street, Upland...",
      volunteersNeeded: 6,
      volunteersSignedUp: 1,
      priorityColor: "bg-accent",
      categoryColor: "bg-primary"
    },
    {
      id: 3,
      title: "Senior Care Assistance",
      description: "Spend time with elderly residents, help with activities and provide companionship.",
      category: "Community",
      priority: "Medium Priority", 
      date: "Jul 24",
      startTime: "10:00 AM",
      endTime: "2:00 PM",
      location: "Local Senior Center",
      volunteersNeeded: 8,
      volunteersSignedUp: 5,
      priorityColor: "bg-primary",
      categoryColor: "bg-accent"
    }
  ];

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
            Current Opportunities
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Find ways to make a meaningful difference in our community.
          </p>
        </div>

        {/* Opportunities Grid - Mobile Horizontal Scroll */}
        <div className="mb-12">
          <div className="flex flex-nowrap gap-6 overflow-x-auto pb-4 md:pb-0 md:flex-wrap md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {opportunities.map((opportunity, index) => (
            <div 
              key={opportunity.id}
              className="group animate-scale-in flex-shrink-0 w-56 min-w-56 md:w-auto"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                {/* Category and Priority Badges */}
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-[#00AFCE] text-white">
                    {opportunity.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#E14F3D]" />
                    <span className="text-sm font-medium text-[#E14F3D]">
                      {opportunity.priority}
                    </span>
                  </div>
                </div>

                {/* Title and Description */}
                <h3 className="text-xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-all duration-300">
                  {opportunity.title}
                </h3>
                <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                  {opportunity.description}
                </p>

                {/* Key Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Date:</span>
                    <span className="text-muted-foreground">{opportunity.date}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Arrival:</span>
                    <span className="text-muted-foreground">{opportunity.startTime}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">End:</span>
                    <span className="text-muted-foreground">{opportunity.endTime}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-[#00AFCE]" />
                    <span className="font-medium text-primary">Location:</span>
                    <span className="text-muted-foreground truncate">{opportunity.location}</span>
                  </div>
                </div>

                {/* Volunteer Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#00AFCE]" />
                      <span className="text-sm font-medium text-primary">
                        {opportunity.volunteersSignedUp} / {opportunity.volunteersNeeded}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Volunteers Signed Up
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-[#00AFCE] transition-all duration-500 rounded-full"
                      style={{ 
                        width: `${(opportunity.volunteersSignedUp / opportunity.volunteersNeeded) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Action Button */}

              </div>
            </div>
          ))}
          </div>
        </div>

        {/* View More */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <PrimaryButton size="lg" className="bg-[#E14F3D] hover:bg-[#E14F3D]/90">
             View All Opportunities
             <ArrowRight className="ml-2 w-5 h-5" />
           </PrimaryButton>
        </div>
      </div>
    </section>
  );
};

export default OpportunitiesSection;