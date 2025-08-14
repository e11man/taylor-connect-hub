import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, Phone, MessageSquare, CheckCircle2, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { DynamicText } from '@/components/content/DynamicText';
import { useContentSection } from '@/hooks/useContent';

const OrganizationPendingApproval: React.FC = () => {
  const { content: pageContent } = useContentSection('organizationPendingApproval', 'main');

  const handleContactSupport = () => {
    // Navigate to main page and scroll to contact section
    window.location.href = '/#contact';
    // Small delay to ensure page loads before scrolling
    setTimeout(() => {
      const contactSection = document.querySelector('#contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      <Header />
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-gray-200">
            
            {/* Success Icon and Status */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                <DynamicText 
                  page="organizationPendingApproval" 
                  section="main" 
                  contentKey="title"
                  fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="title" fallback="Registration Submitted Successfully!" />
                  as="span"
                />
              </h1>
              
              <div className="inline-flex items-center bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-6">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">
                  <DynamicText 
                    page="organizationPendingApproval" 
                    section="main" 
                    contentKey="statusBadge"
                    fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="statusBadge" fallback="Pending Admin Approval" />
                    as="span"
                  />
                </span>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6 mb-8">
              <div className="text-center">
                <p className="text-lg text-gray-700 mb-4">
                  <DynamicText 
                    page="organizationPendingApproval" 
                    section="main" 
                    contentKey="subtitle"
                    fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="subtitle" fallback="Thank you for submitting your organization registration!" />
                    as="span"
                  />
                </p>
                <p className="text-gray-600">
                  <DynamicText 
                    page="organizationPendingApproval" 
                    section="main" 
                    contentKey="description"
                    fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="description" fallback="Your application is currently under review by our administrative team. We will notify you via email once your organization has been approved and you can begin using the platform." />
                    as="span"
                  />
                </p>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  <DynamicText 
                    page="organizationPendingApproval" 
                    section="main" 
                    contentKey="nextStepsTitle"
                    fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="nextStepsTitle" fallback="What happens next?" />
                    as="span"
                  />
                </h3>
                <ul className="space-y-3 text-blue-800">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <DynamicText 
                      page="organizationPendingApproval" 
                      section="main" 
                      contentKey="step1"
                      fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="step1" fallback="Our admin team will review your organization details and credentials" />
                      as="span"
                    />
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <DynamicText 
                      page="organizationPendingApproval" 
                      section="main" 
                      contentKey="step2"
                      fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="step2" fallback="You'll receive an email notification when your application is approved" />
                      as="span"
                    />
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <DynamicText 
                      page="organizationPendingApproval" 
                      section="main" 
                      contentKey="step3"
                      fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="step3" fallback="Once approved, you can log in and start creating events for the community" />
                      as="span"
                    />
                  </li>
                </ul>
              </div>

              {/* Typical Timeline */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <DynamicText 
                    page="organizationPendingApproval" 
                    section="main" 
                    contentKey="timelineTitle"
                    fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="timelineTitle" fallback="Typical Review Timeline" />
                    as="span"
                  />
                </h3>
                <p className="text-gray-700">
                  <DynamicText 
                    page="organizationPendingApproval" 
                    section="main" 
                    contentKey="timelineDescription"
                    fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="timelineDescription" fallback="Most organization applications are reviewed within 2-3 business days. During peak periods, it may take up to 5 business days." />
                    as="span"
                  />
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
                onClick={handleContactSupport}
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                <DynamicText 
                  page="organizationPendingApproval" 
                  section="main" 
                  contentKey="contactButton"
                  fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="contactButton" fallback="Contact Support" />
                  as="span"
                />
              </button>
              
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <DynamicText 
                  page="organizationPendingApproval" 
                  section="main" 
                  contentKey="homeButton"
                  fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="homeButton" fallback="Return Home" />
                  as="span"
                />
              </Link>
            </div>

            {/* Additional Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">
                  <DynamicText 
                    page="organizationPendingApproval" 
                    section="main" 
                    contentKey="additionalInfo"
                    fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="additionalInfo" fallback="Questions about your application status?" />
                    as="span"
                  />
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-500">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span>
                      <DynamicText 
                        page="organizationPendingApproval" 
                        section="main" 
                        contentKey="supportEmail"
                        fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="supportEmail" fallback="support@example.com" />
                        as="span"
                      />
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    <span>
                      <DynamicText 
                        page="organizationPendingApproval" 
                        section="main" 
                        contentKey="supportPhone"
                        fallback=<DynamicText page="organizationPendingApproval" section="main" contentKey="supportPhone" fallback="(555) 123-4567" />
                        as="span"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default OrganizationPendingApproval;