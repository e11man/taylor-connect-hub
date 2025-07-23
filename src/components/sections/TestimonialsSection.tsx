import { Quote } from "lucide-react";

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
    <section className="section-ocean bg-gradient-to-b from-background to-accent-light/30">
      <div className="container-ocean">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
            Stories of Impact
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover how Community Connect is bringing people together and making a difference in our community.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className={`
                relative p-8 rounded-3xl transition-ocean hover-lift animate-scale-in
                ${testimonial.highlight 
                  ? 'bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-accent/30 shadow-glow' 
                  : 'card-ocean'
                }
              `}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 left-8">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  testimonial.highlight ? 'bg-accent' : 'bg-primary'
                }`}>
                  <Quote className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Decorative Line */}
              <div className={`w-16 h-1 mb-6 rounded-full ${
                testimonial.highlight ? 'bg-gradient-to-r from-accent to-primary' : 'bg-accent'
              }`} />

              {/* Content */}
              <blockquote className="text-lg leading-relaxed mb-6 text-foreground italic">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                  testimonial.highlight ? 'bg-gradient-to-br from-accent to-primary' : 'bg-primary'
                }`}>
                  {testimonial.initial}
                </div>
                <div>
                  <div className="font-semibold text-primary">{testimonial.author}</div>
                  <div className={`text-sm ${
                    testimonial.highlight ? 'text-accent font-medium' : 'text-muted-foreground'
                  }`}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="card-ocean max-w-2xl mx-auto text-center p-8 bg-gradient-to-br from-primary/5 to-accent/5">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              Ready to Make Your Impact?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join our community of volunteers and start making a difference today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-ocean">
                Start Volunteering
              </button>
              <button className="btn-outline-ocean">
                Partner With Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;