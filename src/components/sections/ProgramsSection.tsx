import { Package, Users, Hammer, BookOpen, TrendingUp, Heart } from "lucide-react";

const ProgramsSection = () => {
  const programs = [
    {
      icon: Package,
      title: "Basics",
      description: "Essential needs support for families and individuals"
    },
    {
      icon: Users,
      title: "Basics Jr.",
      description: "Youth-focused programs for children and teens"
    },
    {
      icon: Hammer,
      title: "Carpenter's Hands",
      description: "Home repair and construction projects"
    },
    {
      icon: BookOpen,
      title: "ESL",
      description: "English as Second Language tutoring and support"
    },
    {
      icon: TrendingUp,
      title: "Lift",
      description: "Mentorship and encouragement programs"
    },
    {
      icon: Heart,
      title: "ReaLife",
      description: "Real-life skills and life coaching"
    }
  ];

  return (
    <section id="programs" className="bg-white section-padding">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Section Header */}
          <div className="animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
              Community Outreach Programs
            </h2>
            
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-4xl mx-auto">
              Share the love of Christ through diverse service opportunities that address real needs in Upland and foster meaningful relationships.
            </p>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {programs.map((program, index) => (
            <div 
              key={program.title}
              className="group relative bg-white border-2 border-gray-200 rounded-3xl p-6 md:p-8 text-center transition-all duration-500 hover:shadow-lg hover:scale-105 hover:border-[#00AFCE] animate-fade-in"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <div className="relative flex justify-center mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#00AFCE] rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <program.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl md:text-2xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-colors duration-300">
                {program.title}
              </h3>
              
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-montserrat">
                {program.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;