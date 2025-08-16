import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { DynamicText } from "@/components/content/DynamicText";
import { useContentSection } from "@/hooks/useContent";
import { FileText, CheckCircle, AlertTriangle, Users, Shield, Clock } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const TermsOfService = () => {
  usePageTitle("Terms of Service");
  
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
      title: featuresContent.clear_terms_title || <DynamicText page="terms" section="features" contentKey="clear_terms_title" fallback="Clear Terms" />,
      description: featuresContent.clear_terms_description || <DynamicText page="terms" section="features" contentKey="clear_terms_description" fallback="Easy-to-understand terms that protect both users and organizations." />
    },
    {
      icon: CheckCircle,
      title: featuresContent.user_rights_title || <DynamicText page="terms" section="features" contentKey="user_rights_title" fallback="User Rights" />,
      description: featuresContent.user_rights_description || <DynamicText page="terms" section="features" contentKey="user_rights_description" fallback="Your rights and responsibilities are clearly outlined and protected." />
    },
    {
      icon: AlertTriangle,
      title: featuresContent.safety_first_title || <DynamicText page="terms" section="features" contentKey="safety_first_title" fallback="Safety First" />,
      description: featuresContent.safety_first_description || <DynamicText page="terms" section="features" contentKey="safety_first_description" fallback="Comprehensive safety guidelines and liability protections." />
    },
    {
      icon: Users,
      title: featuresContent.community_standards_title || <DynamicText page="terms" section="features" contentKey="community_standards_title" fallback="Community Standards" />,
      description: featuresContent.community_standards_description || <DynamicText page="terms" section="features" contentKey="community_standards_description" fallback="Guidelines that ensure a positive experience for everyone." />
    },
    {
      icon: Shield,
      title: featuresContent.data_protection_title || <DynamicText page="terms" section="features" contentKey="data_protection_title" fallback="Data Protection" />,
      description: featuresContent.data_protection_description || <DynamicText page="terms" section="features" contentKey="data_protection_description" fallback="Your privacy and data security are our top priorities." />
    },
    {
      icon: Clock,
      title: featuresContent.updated_regularly_title || <DynamicText page="terms" section="features" contentKey="updated_regularly_title" fallback="Updated Regularly" />,
      description: featuresContent.updated_regularly_description || <DynamicText page="terms" section="features" contentKey="updated_regularly_description" fallback="Terms are reviewed and updated to reflect current best practices." />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-white border-b border-[#e6ebf1] py-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-[#1B365F] mb-4">
                <DynamicText 
                  page="terms" 
                  section="hero" 
                  contentKey="title"
                  fallback="Terms of Service"
                  as="span"
                />
              </h1>
              <p className="text-xl md:text-2xl text-[#525f7f] mb-6">
                <DynamicText 
                  page="terms" 
                  section="hero" 
                  contentKey="subtitle"
                  fallback="Guidelines for using our platform"
                  as="span"
                />
              </p>
              <div className="inline-flex items-center gap-2 bg-[#E14F3D] bg-opacity-10 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-[#E14F3D] rounded-full"></div>
                <p className="text-lg text-[#1B365F] font-medium">
                  <DynamicText 
                    page="terms" 
                    section="hero" 
                    contentKey="description"
                    fallback="Last updated: January 2024"
                    as="span"
                  />
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Terms Features Grid */}
        <section className="py-16 bg-[#f6f9fc]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {termsFeatures.map((feature, index) => {
                const isOrange = index % 3 === 1;
                const iconBg = isOrange ? 'bg-[#E14F3D]' : 'bg-[#00AFCE]';
                const borderColor = isOrange ? 'border-[#E14F3D] border-opacity-20' : 'border-[#00AFCE] border-opacity-20';
                
                return (
                  <div
                    key={`terms-feature-${index}`}
                    className={`bg-white rounded-lg p-6 shadow-sm border-2 ${borderColor}`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1B365F]">{feature.title}</h3>
                    </div>
                    <p className="text-[#525f7f]">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="prose prose-lg max-w-none">
                {/* Introduction */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="terms" 
                      section="main" 
                      contentKey="intro_title"
                      fallback="Introduction"
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f] leading-relaxed">
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
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="terms" 
                      section="acceptance" 
                      contentKey="title"
                      fallback="Acceptance of Terms"
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f]">
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
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="terms" 
                      section="services" 
                      contentKey="title"
                      fallback="Description of Services"
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f] mb-4">
                    <DynamicText 
                      page="terms" 
                      section="services" 
                      contentKey="description"
                      fallback="Taylor Connect Hub provides a platform that connects students with volunteer opportunities offered by community organizations. Our services include:"
                      as="span"
                    />
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[#525f7f]">
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
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
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
                      <h3 className="text-xl font-semibold text-[#1B365F] mb-3">
                        <DynamicText 
                          page="terms" 
                          section="user" 
                          contentKey="account_title"
                          fallback="Account Management"
                          as="span"
                        />
                      </h3>
                      <p className="text-[#525f7f]">
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
                      <h3 className="text-xl font-semibold text-[#1B365F] mb-3">
                        <DynamicText 
                          page="terms" 
                          section="user" 
                          contentKey="conduct_title"
                          fallback="Code of Conduct"
                          as="span"
                        />
                      </h3>
                      <p className="text-[#525f7f]">
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
                      <h3 className="text-xl font-semibold text-[#1B365F] mb-3">
                        <DynamicText 
                          page="terms" 
                          section="user" 
                          contentKey="participation_title"
                          fallback="Event Participation"
                          as="span"
                        />
                      </h3>
                      <p className="text-[#525f7f]">
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
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
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
                      <h3 className="text-xl font-semibold text-[#1B365F] mb-3">
                        <DynamicText 
                          page="terms" 
                          section="organization" 
                          contentKey="event_title"
                          fallback="Event Management"
                          as="span"
                        />
                      </h3>
                      <p className="text-[#525f7f]">
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
                      <h3 className="text-xl font-semibold text-[#1B365F] mb-3">
                        <DynamicText 
                          page="terms" 
                          section="organization" 
                          contentKey="communication_title"
                          fallback="Communication"
                          as="span"
                        />
                      </h3>
                      <p className="text-[#525f7f]">
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
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="terms" 
                      section="liability" 
                      contentKey="title"
                      fallback="Limitation of Liability"
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f]">
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
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="terms" 
                      section="termination" 
                      contentKey="title"
                      fallback="Termination"
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f]">
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
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="terms" 
                      section="contact" 
                      contentKey="title"
                      fallback="Contact Information"
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f]">
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;