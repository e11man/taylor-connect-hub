import { Calendar, MapPin, Users, Star } from "lucide-react";
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
    <section id="opportunities" className="section-ocean bg-gradient-to-b from-secondary/30 to-background">
      <div className="container-ocean">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
            Current Opportunities
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Find ways to make a meaningful difference in our community.
          </p>
        </div>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {opportunities.map((opportunity, index) => (
            <div 
              key={opportunity.id}
              className="card-glow group animate-scale-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Category and Priority Badges */}
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${opportunity.categoryColor}`}>
                  {opportunity.category}
                </span>
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${opportunity.priorityColor.replace('bg-', 'text-')}`} />
                  <span className={`text-sm font-medium ${opportunity.priorityColor.replace('bg-', 'text-')}`}>
                    {opportunity.priority}
                  </span>
                </div>
              </div>

              {/* Title and Description */}
              <h3 className="text-xl font-bold mb-3 text-primary group-hover:text-accent transition-ocean">
                {opportunity.title}
              </h3>
              <p className="text-muted-foreground mb-6 line-clamp-3">
                {opportunity.description}
              </p>

              {/* Key Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="font-medium text-primary">Date:</span>
                  <span className="text-muted-foreground">{opportunity.date}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="font-medium text-primary">Arrival:</span>
                  <span className="text-muted-foreground">{opportunity.startTime}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="font-medium text-primary">End:</span>
                  <span className="text-muted-foreground">{opportunity.endTime}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="font-medium text-primary">Location:</span>
                  <span className="text-muted-foreground truncate">{opportunity.location}</span>
                </div>
              </div>

              {/* Volunteer Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-primary">
                      {opportunity.volunteersSignedUp} / {opportunity.volunteersNeeded}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Volunteers Signed Up
                  </span>
                </div>
                
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${(opportunity.volunteersSignedUp / opportunity.volunteersNeeded) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <PrimaryButton 
                size="md" 
                className="w-full group-hover:scale-105 transition-spring"
                variant="ocean"
              >
                Join Now
              </PrimaryButton>
            </div>
          ))}
        </div>

        {/* View More */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <PrimaryButton size="lg" variant="wave">
            View All Opportunities
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
};

export default OpportunitiesSection;