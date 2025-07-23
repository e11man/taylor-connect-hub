import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import PrimaryButton from "@/components/buttons/PrimaryButton";

const SearchSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", name: "All", icon: "🌟" },
    { id: "community", name: "Community", icon: "🏘️" },
    { id: "education", name: "Education", icon: "📚" },
    { id: "environment", name: "Environment", icon: "🌱" },
    { id: "health", name: "Health", icon: "🏥" },
    { id: "fundraising", name: "Fundraising", icon: "💰" },
    { id: "other", name: "Other", icon: "✨" }
  ];

  return (
    <section className="section-ocean bg-gradient-to-b from-background to-secondary/30">
      <div className="container-ocean">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
            Find Your Perfect Volunteer Opportunity
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
              className="pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-border/50 focus:border-accent bg-background/80 backdrop-blur-sm transition-ocean"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-primary">Filter Opportunities</h3>
            <p className="text-muted-foreground">Click on a category to filter opportunities</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  px-6 py-3 rounded-2xl font-semibold transition-spring border-2 hover:scale-105
                  ${activeCategory === category.id
                    ? 'bg-accent text-accent-foreground border-accent shadow-lg'
                    : 'bg-background text-foreground border-border/50 hover:border-accent/50 hover:bg-accent/5'
                  }
                `}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PrimaryButton size="lg" className="bg-gradient-to-r from-primary to-accent">
              <Filter className="mr-2 w-5 h-5" />
              Advanced Filters
            </PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;