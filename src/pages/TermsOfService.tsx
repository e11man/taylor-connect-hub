import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedText from "@/components/ui/animated-text";
import { DynamicText } from "@/components/content/DynamicText";
import { useContentSection } from "@/hooks/useContent";
import { motion } from "framer-motion";
import { FileText, CheckCircle, AlertTriangle, Users, Shield, Clock } from "lucide-react";

const TermsOfService = () => {
  const { content: heroContent } = useContentSection('terms', 'hero');
  const { content: mainContent } = useContentSection('terms', 'main');
  const { content: acceptanceContent } = useContentSection('terms', 'acceptance');
  const { content: servicesContent } = useContentSection('terms', 'services');
  const { content: userContent } = useContentSection('terms', 'user');
  const { content: organizationContent } = useContentSection('terms', 'organization');
  const { content: liabilityContent } = useContentSection('terms', 'liability');
  const { content: terminationContent } = useContentSection('terms', 'termination');
  const { content: contactContent } = useContentSection('terms', 'contact');

  const { content: featuresContent } = useContentSection('terms', 'features');
  
  const termsFeatures = [
    {
      icon: FileText,
      title: featuresContent.clear_terms_title || "Clear Terms",
      description: featuresContent.clear_terms_description || "Easy-to-understand terms that protect both users and organizations."
    },
    {
      icon: CheckCircle,
      title: featuresContent.user_rights_title || "User Rights",
      description: featuresContent.user_rights_description || "Your rights and responsibilities are clearly outlined and protected."
    },
    {
      icon: AlertTriangle,
      title: featuresContent.safety_first_title || "Safety First",
      description: featuresContent.safety_first_description || "Comprehensive safety guidelines and liability protections."
    },
    {
      icon: Users,
      title: featuresContent.community_standards_title || "Community Standards",
      description: featuresContent.community_standards_description || "Guidelines that ensure a positive experience for everyone."
    },
    {
      icon: Shield,
      title: featuresContent.data_protection_title || "Data Protection",
      description: featuresContent.data_protection_description || "Your privacy and data security are our top priorities."
    },
    {
      icon: Clock,
      title: featuresContent.updated_regularly_title || "Updated Regularly",
      description: featuresContent.updated_regularly_description || "Terms are reviewed and updated to reflect current best practices."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#00AFCE] to-[#0A2540] text-white py-20">
          <div className="container-custom">
            <AnimatedSection variant="fade" delay={0.1}>
              <div className="text-center max-w-4xl mx-auto">
                <AnimatedText
                  variant="slide-up"
                  delay={0.2}
                  className="text-5xl md:text-6xl font-bold mb-6"
                >
                  <DynamicText 
                    page="terms" 
                    section="hero" 
                    contentKey="title"
                    fallback="Terms of Service"
                    as="span"
                  />
                </AnimatedText>
                <AnimatedText
                  variant="slide-up"
                  delay={0.3}
                  className="text-xl md:text-2xl text-blue-100 mb-8"
                >
                  <DynamicText 
                    page="terms" 
                    section="hero" 
                    contentKey="subtitle"
                    fallback="Guidelines for using our platform"
                    as="span"
                  />
                </AnimatedText>
                <AnimatedText
                  variant="slide-up"
                  delay={0.4}
                  className="text-lg text-blue-200"
                >
                  <DynamicText 
                    page="terms" 
                    section="hero" 
                    contentKey="description"
                    fallback="Last updated: January 2024"
                    as="span"
                  />
                </AnimatedText>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Terms Features Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <AnimatedSection variant="fade" delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {termsFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { duration: 0.5, delay: index * 0.1 }
                    }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-[#00AFCE] rounded-lg flex items-center justify-center mr-4">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container-custom max-w-4xl">
            <AnimatedSection variant="fade" delay={0.1}>
              <div className="prose prose-lg max-w-none">
                {/* Introduction */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    <DynamicText 
                      page="terms" 
                      section="main" 
                      contentKey="intro_title"
                      fallback="Introduction"
                      as="span"
                    />
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    <DynamicText 
                      page="terms" 
                      section="main" 
                      contentKey="intro_text"
                      fallback="Welcome to Taylor Connect Hub. These Terms of Service govern your use of our platform and services. By accessing or using our platform, you agree to be bound by these terms and all applicable laws and regulations."
                      as="span"
                    />
                  </p>
                </div>

                {/* Acceptance of Terms */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    <DynamicText 
                      page="terms" 
                      section="acceptance" 
                      contentKey="title"
                      fallback="Acceptance of Terms"
                      as="span"
                    />
                  </h2>
                  <p className="text-gray-700">
                    <DynamicText 
                      page="terms" 
                      section="acceptance" 
                      contentKey="description"
                      fallback="By creating an account, signing up for events, or using our platform in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services."
                      as="span"
                    />
                  </p>
                </div>

                {/* Services Description */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    <DynamicText 
                      page="terms" 
                      section="services" 
                      contentKey="title"
                      fallback="Description of Services"
                      as="span"
                    />
                  </h2>
                  <p className="text-gray-700 mb-4">
                    <DynamicText 
                      page="terms" 
                      section="services" 
                      contentKey="description"
                      fallback="Taylor Connect Hub provides a platform that connects students with volunteer opportunities offered by community organizations. Our services include:"
                      as="span"
                    />
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>
                      <DynamicText 
                        page="terms" 
                        section="services" 
                        contentKey="service1"
                        fallback="Event creation and management for organizations"
                        as="span"
                      />
                    </li>
                    <li>
                      <DynamicText 
                        page="terms" 
                        section="services" 
                        contentKey="service2"
                        fallback="Volunteer opportunity discovery and signup"
                        as="span"
                      />
                    </li>
                    <li>
                      <DynamicText 
                        page="terms" 
                        section="services" 
                        contentKey="service3"
                        fallback="Communication tools between volunteers and organizations"
                        as="span"
                      />
                    </li>
                    <li>
                      <DynamicText 
                        page="terms" 
                        section="services" 
                        contentKey="service4"
                        fallback="Administrative tools and reporting"
                        as="span"
                      />
                    </li>
                  </ul>
                </div>

                {/* User Responsibilities */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    <DynamicText 
                      page="terms" 
                      section="user" 
                      contentKey="title"
                      fallback="User Responsibilities"
                      as="span"
                    />
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        <DynamicText 
                          page="terms" 
                          section="user" 
                          contentKey="account_title"
                          fallback="Account Management"
                          as="span"
                        />
                      </h3>
                      <p className="text-gray-700">
                        <DynamicText 
                          page="terms" 
                          section="user" 
                          contentKey="account_text"
                          fallback="You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account."
                          as="span"
                        />
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        <DynamicText 
                          page="terms" 
                          section="user" 
                          contentKey="conduct_title"
                          fallback="Code of Conduct"
                          as="span"
                        />
                      </h3>
                      <p className="text-gray-700">
                        <DynamicText 
                          page="terms" 
                          section="user" 
                          contentKey="conduct_text"
                          fallback="You agree to use our platform in a manner that is respectful, lawful, and appropriate. You will not engage in any activity that could harm, disable, or impair our services or interfere with other users' enjoyment of the platform."
                          as="span"
                        />
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        <DynamicText 
                          page="terms" 
                          section="user" 
                          contentKey="participation_title"
                          fallback="Event Participation"
                          as="span"
                        />
                      </h3>
                      <p className="text-gray-700">
                        <DynamicText 
                          page="terms" 
                          section="user" 
                          contentKey="participation_text"
                          fallback="When you sign up for volunteer events, you commit to attending and participating responsibly. You should arrive on time, follow safety guidelines, and treat all participants with respect."
                          as="span"
                        />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Organization Responsibilities */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    <DynamicText 
                      page="terms" 
                      section="organization" 
                      contentKey="title"
                      fallback="Organization Responsibilities"
                      as="span"
                    />
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        <DynamicText 
                          page="terms" 
                          section="organization" 
                          contentKey="event_title"
                          fallback="Event Management"
                          as="span"
                        />
                      </h3>
                      <p className="text-gray-700">
                        <DynamicText 
                          page="terms" 
                          section="organization" 
                          contentKey="event_text"
                          fallback="Organizations are responsible for providing accurate event information, maintaining safe environments, and ensuring proper supervision of volunteers. Events must comply with all applicable laws and regulations."
                          as="span"
                        />
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        <DynamicText 
                          page="terms" 
                          section="organization" 
                          contentKey="communication_title"
                          fallback="Communication"
                          as="span"
                        />
                      </h3>
                      <p className="text-gray-700">
                        <DynamicText 
                          page="terms" 
                          section="organization" 
                          contentKey="communication_text"
                          fallback="Organizations must respond promptly to volunteer inquiries and provide clear instructions for event participation. Any changes to events should be communicated immediately."
                          as="span"
                        />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Limitation of Liability */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    <DynamicText 
                      page="terms" 
                      section="liability" 
                      contentKey="title"
                      fallback="Limitation of Liability"
                      as="span"
                    />
                  </h2>
                  <p className="text-gray-700">
                    <DynamicText 
                      page="terms" 
                      section="liability" 
                      contentKey="description"
                      fallback="Taylor Connect Hub serves as a platform to connect volunteers with organizations. We are not responsible for the conduct of individual users or organizations, nor for any injuries, damages, or losses that may occur during volunteer activities. Users participate in events at their own risk."
                      as="span"
                    />
                  </p>
                </div>

                {/* Termination */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    <DynamicText 
                      page="terms" 
                      section="termination" 
                      contentKey="title"
                      fallback="Termination"
                      as="span"
                    />
                  </h2>
                  <p className="text-gray-700">
                    <DynamicText 
                      page="terms" 
                      section="termination" 
                      contentKey="description"
                      fallback="We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason we deem appropriate. You may also terminate your account at any time by contacting us."
                      as="span"
                    />
                  </p>
                </div>

                {/* Contact Information */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    <DynamicText 
                      page="terms" 
                      section="contact" 
                      contentKey="title"
                      fallback="Contact Information"
                      as="span"
                    />
                  </h2>
                  <p className="text-gray-700">
                    <DynamicText 
                      page="terms" 
                      section="contact" 
                      contentKey="description"
                      fallback="If you have any questions about these Terms of Service, please contact us at legal@taylor.edu"
                      as="span"
                    />
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService; 