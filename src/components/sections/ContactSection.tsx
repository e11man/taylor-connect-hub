import { useState } from "react";
import { Send, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { useToast } from "@/hooks/use-toast";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "", 
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setFormData({ name: "", email: "", message: "" });
    
    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you within 24 hours.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      content: "hello@communityconnect.org",
      description: "Send us a message anytime"
    },
    {
      icon: Phone, 
      title: "Call Us",
      content: "(555) 123-4567",
      description: "Monday - Friday, 9AM - 5PM"
    },
    {
      icon: MapPin,
      title: "Visit Us", 
      content: "1846 South Main Street",
      description: "Upland, CA 91784"
    }
  ];

  return (
    <section id="contact" className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
            Get In Touch
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Have questions or want to learn more about our volunteer opportunities? 
            Send us a message and we'll get back to you soon.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-2xl md:text-3xl font-montserrat font-bold mb-8 text-primary">Contact Information</h3>
            
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div 
                  key={info.title}
                  className="group bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#00AFCE] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <info.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-montserrat font-bold text-primary mb-1 group-hover:text-[#00AFCE] transition-all duration-300">{info.title}</h4>
                      <p className="text-lg font-medium text-foreground mb-1">{info.content}</p>
                      <p className="text-sm text-muted-foreground font-montserrat font-semibold">{info.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-12 bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300">
              <h4 className="font-montserrat font-bold text-primary mb-3">Quick Response</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We typically respond to messages within 24 hours during business days. 
                For urgent matters, please call us directly.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300">
              <h3 className="text-2xl md:text-3xl font-montserrat font-bold mb-6 text-primary">Send us a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    Your Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00AFCE] transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    Your Email *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00AFCE] transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    Your Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us how we can help you..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00AFCE] transition-all duration-300 resize-none"
                  />
                </div>

                <PrimaryButton
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full bg-[#00AFCE] hover:bg-[#00AFCE]/90"
                >
                  <Send className="mr-2 w-5 h-5" />
                  Send Message
                </PrimaryButton>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;