import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import PrimaryButton from "@/components/buttons/PrimaryButton";

const SearchSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", name: "All" },
    { id: "community", name: "Community" },
    { id: "education", name: "Education" },
    { id: "environment", name: "Environment" },
    { id: "health", name: "Health" },
    { id: "fundraising", name: "Fundraising" },
    { id: "other", name: "Other" }
  ];

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
            Find Your Perfect Volunteer Opportunity
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Search and filter opportunities based on your interests, skills, and availability.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-[#00AFCE] bg-white transition-all duration-300"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-montserrat font-semibold mb-4 text-primary">Filter Opportunities</h3>
            <p className="text-muted-foreground">Click on a category to filter opportunities</p>
          </div>

          <div className="overflow-x-auto pb-4" style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}>
            <style>
              {`.overflow-x-auto::-webkit-scrollbar { display: none; }`}
            </style>
            <div className="flex gap-4 min-w-max px-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    px-6 py-3 rounded-2xl font-montserrat font-semibold transition-all duration-300 border-2 hover:scale-105 whitespace-nowrap
                    ${activeCategory === category.id
                      ? 'bg-[#E14F3D] text-white border-[#E14F3D] shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#00AFCE] hover:text-[#00AFCE]'
                    }
                  `}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default SearchSection;