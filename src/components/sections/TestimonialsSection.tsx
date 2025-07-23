import { Quote } from "lucide-react";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      content: "Community Connect helped me find the perfect volunteer opportunity. I've made lifelong friends while making a real difference in our community.",
      author: "Sarah Johnson",
      role: "Volunteer",
      initial: "S",
      highlight: false
    },
    {
      id: 2,
      content: "The platform made it so easy to find volunteers for our literacy program. We've been able to reach twice as many students this year.",
      author: "Marcus Chen",
      role: "Program Director", 
      initial: "M",
      highlight: false
    },
    {
      id: 3,
      content: "I love how the opportunities are categorized and filtered. It's never been easier to find causes I'm passionate about.",
      author: "Emma Rodriguez",
      role: "Student",
      initial: "E",
      highlight: true
    }
  ];

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
            Stories of Impact
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover how Community Connect is bringing people together and making a difference in our community.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mb-12">
          <div className="flex flex-nowrap gap-6 overflow-x-auto pb-4 md:pb-0 md:flex-wrap md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.id}
                className="group animate-scale-in flex-shrink-0 w-80 min-w-80 md:w-auto"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`
                  bg-white rounded-3xl p-8 border-2 transition-all duration-300 h-full flex flex-col
                  ${testimonial.highlight 
                    ? 'border-[#00AFCE] shadow-lg' 
                    : 'border-gray-200 hover:border-[#00AFCE] hover:shadow-lg'
                  }
                `}>
                  {/* Quote Icon */}
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 ${
                      testimonial.highlight ? 'bg-[#E14F3D]' : 'bg-[#00AFCE]'
                    }`}>
                      <Quote className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <blockquote className="text-lg leading-relaxed mb-6 text-muted-foreground italic flex-grow">
                    "{testimonial.content}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-montserrat font-bold text-white ${
                      testimonial.highlight ? 'bg-[#E14F3D]' : 'bg-[#00AFCE]'
                    }`}>
                      {testimonial.initial}
                    </div>
                    <div>
                      <div className="font-montserrat font-bold text-primary group-hover:text-[#00AFCE] transition-all duration-300">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground font-montserrat font-semibold">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="bg-white border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300 rounded-3xl max-w-2xl mx-auto text-center p-8">
            <h3 className="text-2xl md:text-3xl font-montserrat font-bold mb-4 text-primary">
              Ready to Make Your Impact?
            </h3>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Join our community of volunteers and start making a difference today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PrimaryButton size="lg" className="bg-[#00AFCE] hover:bg-[#00AFCE]/90">
                Start Volunteering
              </PrimaryButton>
              <SecondaryButton size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                Partner With Us
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;