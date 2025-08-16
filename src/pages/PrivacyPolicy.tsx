import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { DynamicText } from "@/components/content/DynamicText";
import { useContentSection } from "@/hooks/useContent";
import { Shield, Eye, Lock, Users, Database, Bell } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const PrivacyPolicy = () => {
  usePageTitle("Privacy Policy");
  
  const { content: heroContent } = useContentSection('privacy', 'hero');
  const { content: mainContent } = useContentSection('privacy', 'main');
  const { content: collectionContent } = useContentSection('privacy', 'collection');
  const { content: usageContent } = useContentSection('privacy', 'usage');
  const { content: sharingContent } = useContentSection('privacy', 'sharing');
  const { content: securityContent } = useContentSection('privacy', 'security');
  const { content: rightsContent } = useContentSection('privacy', 'rights');
  const { content: contactContent } = useContentSection('privacy', 'contact');

  const { content: featuresContent } = useContentSection('privacy', 'features');
  
  const privacyFeatures = [
    {
      icon: Shield,
      title: featuresContent.data_protection_title || <DynamicText page="privacy" section="features" contentKey="data_protection_title" fallback=<DynamicText page="terms" section="features" contentKey="data_protection_title" fallback="Data Protection" /> />,
      description: featuresContent.data_protection_description || <DynamicText page="privacy" section="features" contentKey="data_protection_description" fallback="Your personal information is protected with industry-standard security measures." />
    },
    {
      icon: Eye,
      title: featuresContent.transparency_title || <DynamicText page="privacy" section="features" contentKey="transparency_title" fallback="Transparency" />,
      description: featuresContent.transparency_description || <DynamicText page="privacy" section="features" contentKey="transparency_description" fallback="We're clear about what data we collect and how we use it." />
    },
    {
      icon: Lock,
      title: featuresContent.secure_storage_title || <DynamicText page="privacy" section="features" contentKey="secure_storage_title" fallback="Secure Storage" />,
      description: featuresContent.secure_storage_description || <DynamicText page="privacy" section="features" contentKey="secure_storage_description" fallback="All data is encrypted and stored securely in our database." />
    },
    {
      icon: Users,
      title: featuresContent.user_control_title || <DynamicText page="privacy" section="features" contentKey="user_control_title" fallback="User Control" />,
      description: featuresContent.user_control_description || <DynamicText page="privacy" section="features" contentKey="user_control_description" fallback="You have full control over your data and can request changes anytime." />
    },
    {
      icon: Database,
      title: featuresContent.limited_collection_title || <DynamicText page="privacy" section="features" contentKey="limited_collection_title" fallback="Limited Collection" />,
      description: featuresContent.limited_collection_description || <DynamicText page="privacy" section="features" contentKey="limited_collection_description" fallback="We only collect the information necessary to provide our services." />
    },
    {
      icon: Bell,
      title: featuresContent.notifications_title || <DynamicText page="privacy" section="features" contentKey="notifications_title" fallback="Notifications" />,
      description: featuresContent.notifications_description || <DynamicText page="privacy" section="features" contentKey="notifications_description" fallback="You control how and when you receive communications from us." />
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
                  page="privacy" 
                  section="hero" 
                  contentKey="title"
                  fallback=<DynamicText page="footer" section="links" contentKey="privacy" fallback=<DynamicText page="footer" section="links" contentKey="privacy_link" fallback=<DynamicText page="organizationRegister" section="page" contentKey="privacy_link" fallback=<DynamicText page="privacy" section="hero" contentKey="title" fallback="Privacy Policy" /> /> /> />
                  as="span"
                />
              </h1>
              <p className="text-xl md:text-2xl text-[#525f7f] mb-6">
                <DynamicText 
                  page="privacy" 
                  section="hero" 
                  contentKey="subtitle"
                  fallback=<DynamicText page="privacy" section="hero" contentKey="subtitle" fallback="How we protect and handle your information" />
                  as="span"
                />
              </p>
              <div className="inline-flex items-center gap-2 bg-[#E14F3D] bg-opacity-10 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-[#E14F3D] rounded-full"></div>
                <p className="text-lg text-[#1B365F] font-medium">
                  <DynamicText 
                    page="privacy" 
                    section="hero" 
                    contentKey="description"
                    fallback=<DynamicText page="privacy" section="hero" contentKey="description" fallback=<DynamicText page="terms" section="hero" contentKey="description" fallback="Last updated: January 2024" /> />
                    as="span"
                  />
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Features Grid */}
        <section className="py-16 bg-[#f6f9fc]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {privacyFeatures.map((feature, index) => {
                const isOrange = index % 3 === 1;
                const iconBg = isOrange ? 'bg-[#E14F3D]' : 'bg-[#00AFCE]';
                const borderColor = isOrange ? 'border-[#E14F3D] border-opacity-20' : 'border-[#00AFCE] border-opacity-20';
                
                return (
                  <div
                    key={`privacy-feature-${index}`}
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
                      page="privacy" 
                      section="main" 
                      contentKey="intro_title"
                      fallback=<DynamicText page="privacy" section="main" contentKey="intro_title" fallback=<DynamicText page="terms" section="main" contentKey="intro_title" fallback="Introduction" /> />
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f] leading-relaxed">
                    <DynamicText 
                      page="privacy" 
                      section="main" 
                      contentKey="intro_text"
                      fallback="Taylor Connect Hub is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform."
                      as="span"
                    />
                  </p>
                </div>

                {/* Information We Collect */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="privacy" 
                      section="collection" 
                      contentKey="title"
                      fallback=<DynamicText page="privacy" section="collection" contentKey="title" fallback="Information We Collect" />
                      as="span"
                    />
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#1B365F] mb-3">
                        <DynamicText 
                          page="privacy" 
                          section="collection" 
                          contentKey="personal_title"
                          fallback=<DynamicText page="privacy" section="collection" contentKey="personal_title" fallback="Personal Information" />
                          as="span"
                        />
                      </h3>
                      <p className="text-[#525f7f]">
                        <DynamicText 
                          page="privacy" 
                          section="collection" 
                          contentKey="personal_text"
                          fallback=<DynamicText page="privacy" section="collection" contentKey="personal_text" fallback="We collect information you provide directly to us, such as when you create an account, sign up for events, or contact us. This may include your name, email address, phone number, and other contact information." />
                          as="span"
                        />
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#1B365F] mb-3">
                        <DynamicText 
                          page="privacy" 
                          section="collection" 
                          contentKey="usage_title"
                          fallback=<DynamicText page="privacy" section="collection" contentKey="usage_title" fallback="Usage Information" />
                          as="span"
                        />
                      </h3>
                      <p className="text-[#525f7f]">
                        <DynamicText 
                          page="privacy" 
                          section="collection" 
                          contentKey="usage_text"
                          fallback=<DynamicText page="privacy" section="collection" contentKey="usage_text" fallback="We automatically collect certain information about your use of our platform, including your IP address, browser type, operating system, and pages visited." />
                          as="span"
                        />
                      </p>
                    </div>
                  </div>
                </div>

                {/* How We Use Your Information */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="privacy" 
                      section="usage" 
                      contentKey="title"
                      fallback=<DynamicText page="privacy" section="usage" contentKey="title" fallback="How We Use Your Information" />
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f] mb-4">
                    <DynamicText 
                      page="privacy" 
                      section="usage" 
                      contentKey="description"
                      fallback=<DynamicText page="privacy" section="usage" contentKey="description" fallback="We use the information we collect to:" />
                      as="span"
                    />
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[#525f7f]">
                    <li>
                      <DynamicText 
                        page="privacy" 
                        section="usage" 
                        contentKey="purpose1"
                        fallback=<DynamicText page="privacy" section="usage" contentKey="purpose1" fallback="Provide and maintain our services" />
                        as="span"
                      />
                    </li>
                    <li>
                      <DynamicText 
                        page="privacy" 
                        section="usage" 
                        contentKey="purpose2"
                        fallback=<DynamicText page="privacy" section="usage" contentKey="purpose2" fallback="Connect you with volunteer opportunities" />
                        as="span"
                      />
                    </li>
                    <li>
                      <DynamicText 
                        page="privacy" 
                        section="usage" 
                        contentKey="purpose3"
                        fallback=<DynamicText page="privacy" section="usage" contentKey="purpose3" fallback="Send you important updates and notifications" />
                        as="span"
                      />
                    </li>
                    <li>
                      <DynamicText 
                        page="privacy" 
                        section="usage" 
                        contentKey="purpose4"
                        fallback=<DynamicText page="privacy" section="usage" contentKey="purpose4" fallback="Improve our platform and user experience" />
                        as="span"
                      />
                    </li>
                  </ul>
                </div>

                {/* Information Sharing */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="privacy" 
                      section="sharing" 
                      contentKey="title"
                      fallback=<DynamicText page="privacy" section="sharing" contentKey="title" fallback="Information Sharing" />
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f]">
                    <DynamicText 
                      page="privacy" 
                      section="sharing" 
                      contentKey="description"
                      fallback=<DynamicText page="privacy" section="sharing" contentKey="description" fallback="We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law." />
                      as="span"
                    />
                  </p>
                </div>

                {/* Data Security */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="privacy" 
                      section="security" 
                      contentKey="title"
                      fallback=<DynamicText page="privacy" section="security" contentKey="title" fallback="Data Security" />
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f]">
                    <DynamicText 
                      page="privacy" 
                      section="security" 
                      contentKey="description"
                      fallback=<DynamicText page="privacy" section="security" contentKey="description" fallback="We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction." />
                      as="span"
                    />
                  </p>
                </div>

                {/* Your Rights */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="privacy" 
                      section="rights" 
                      contentKey="title"
                      fallback=<DynamicText page="privacy" section="rights" contentKey="title" fallback="Your Rights" />
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f] mb-4">
                    <DynamicText 
                      page="privacy" 
                      section="rights" 
                      contentKey="description"
                      fallback=<DynamicText page="privacy" section="rights" contentKey="description" fallback="You have the right to:" />
                      as="span"
                    />
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[#525f7f]">
                    <li>
                      <DynamicText 
                        page="privacy" 
                        section="rights" 
                        contentKey="right1"
                        fallback=<DynamicText page="privacy" section="rights" contentKey="right1" fallback="Access your personal information" />
                        as="span"
                      />
                    </li>
                    <li>
                      <DynamicText 
                        page="privacy" 
                        section="rights" 
                        contentKey="right2"
                        fallback=<DynamicText page="privacy" section="rights" contentKey="right2" fallback="Correct inaccurate information" />
                        as="span"
                      />
                    </li>
                    <li>
                      <DynamicText 
                        page="privacy" 
                        section="rights" 
                        contentKey="right3"
                        fallback=<DynamicText page="privacy" section="rights" contentKey="right3" fallback="Request deletion of your information" />
                        as="span"
                      />
                    </li>
                    <li>
                      <DynamicText 
                        page="privacy" 
                        section="rights" 
                        contentKey="right4"
                        fallback=<DynamicText page="privacy" section="rights" contentKey="right4" fallback="Opt out of certain communications" />
                        as="span"
                      />
                    </li>
                  </ul>
                </div>

                {/* Contact Us */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-[#1B365F] mb-6">
                    <DynamicText 
                      page="privacy" 
                      section="contact" 
                      contentKey="title"
                      fallback=<DynamicText page="privacy" section="contact" contentKey="title" fallback="Contact Us" />
                      as="span"
                    />
                  </h2>
                  <p className="text-[#525f7f]">
                    <DynamicText 
                      page="privacy" 
                      section="contact" 
                      contentKey="description"
                      fallback=<DynamicText page="privacy" section="contact" contentKey="description" fallback="If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@taylor.edu" />
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

export default PrivacyPolicy;