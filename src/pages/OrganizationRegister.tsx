import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building2, User2, AlignLeft, Globe, Phone, Loader2, Info } from 'lucide-react';
import PrimaryButton from '../components/buttons/PrimaryButton';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UserAuthModal from '@/components/modals/UserAuthModal';
import { OrganizationOTPVerification } from '@/components/auth/OrganizationOTPVerification';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContentSection } from '@/hooks/useContent';
import { DynamicText } from '@/components/content/DynamicText';

const OrganizationRegister: React.FC = () => {
  const { content: pageContent, loading: contentLoading } = useContentSection('organizationRegister', 'main');
  const { content: formContent } = useContentSection('organizationRegister', 'form');
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationDescription: '',
    website: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const { toast } = useToast();

  // Generate a random 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP via edge function
  const sendOTP = async (email: string, organizationName: string) => {
    const otp = generateOTP();
    
    try {
      const response = await fetch('/functions/v1/send-organization-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          email,
          otp,
          organizationName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP email');
      }

      return otp;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  const validate = () => {
    let newErrors: Record<string, string> = {};
    if (!formData.organizationName) {
      newErrors.organizationName = 'Organization name is required';
    }
    if (!formData.contactName) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.organizationDescription) {
      newErrors.organizationDescription = 'Organization description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      
      try {
        // First, generate and send OTP
        const otp = await sendOTP(formData.email, formData.organizationName);
        
        // Then sign up with Supabase using the OTP we generated
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              user_type: 'organization',
              organization_name: formData.organizationName,
              description: formData.organizationDescription,
              website: formData.website,
              phone: formData.phoneNumber,
              otp_code: otp  // Store OTP for verification
            }
          }
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Verification Code Sent! 📧",
          description: "Please check your email for a 6-digit verification code.",
        });

        // Show OTP verification step
        setShowOTPVerification(true);
      } catch (error: any) {
        toast({
          title: "Registration failed",
          description: error.message || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerificationComplete = () => {
    // Reset form and go back to registration
    setFormData({
      organizationName: '',
      contactName: '',
      email: '',
      password: '',
      confirmPassword: '',
      organizationDescription: '',
      website: '',
      phoneNumber: '',
    });
    setShowOTPVerification(false);
    
    toast({
      title: "Organization Verified Successfully! 🎉",
      description: "Your organization is now pending admin approval. You'll receive an email when approved.",
    });
  };

  const handleBackToRegistration = () => {
    setShowOTPVerification(false);
  };

  // Show OTP verification if in that step
  if (showOTPVerification) {
    return (
      <div className="min-h-screen bg-gray-50 font-montserrat">
        <Header />
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <OrganizationOTPVerification
              email={formData.email}
              organizationName={formData.organizationName}
              onVerificationComplete={handleVerificationComplete}
              onBack={handleBackToRegistration}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      <Header />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div>
          <h2 className="mt-6 text-center text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            <DynamicText 
              page="organizationRegister" 
              section="main" 
              contentKey="title"
              fallback="Register Your Organization"
              as="span"
            />
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            <DynamicText 
              page="organizationRegister" 
              section="main" 
              contentKey="subtitle"
              fallback="Join our community to post volunteer opportunities."
              as="span"
            />
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px flex flex-col gap-6">
            {/* Organization Name */}
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                <DynamicText 
                  page="organizationRegister" 
                  section="form" 
                  contentKey="organizationNameLabel"
                  fallback="Organization Name"
                  as="span"
                />
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  autoComplete="organization"
                  required
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#00AFCE] focus:border-[#00AFCE] transition-colors duration-200 font-montserrat ${
                    errors.organizationName ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={formContent?.organizationNamePlaceholder || "Enter your organization's name"}
                />
              </div>
              {errors.organizationName && (
                <p className="mt-1 text-sm text-red-600 font-montserrat">{errors.organizationName}</p>
              )}
            </div>

            {/* Contact Name */}
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                <DynamicText 
                  page="organizationRegister" 
                  section="form" 
                  contentKey="contactNameLabel"
                  fallback="Contact Person Name"
                  as="span"
                />
              </label>
              <div className="relative">
                <User2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#00AFCE] focus:border-[#00AFCE] transition-colors duration-200 font-montserrat ${
                    errors.contactName ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={formContent?.contactNamePlaceholder || "Enter contact person's full name"}
                />
              </div>
              {errors.contactName && (
                <p className="mt-2 text-sm text-red-600 font-montserrat">{errors.contactName}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                <DynamicText 
                  page="organizationRegister" 
                  section="form" 
                  contentKey="emailLabel"
                  fallback="Email"
                  as="span"
                />
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#00AFCE] focus:border-[#00AFCE] transition-colors duration-200 font-montserrat ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={formContent?.emailPlaceholder || "Enter your organization's email"}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 font-montserrat">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                <DynamicText 
                  page="organizationRegister" 
                  section="form" 
                  contentKey="passwordLabel"
                  fallback="Password"
                  as="span"
                />
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#00AFCE] focus:border-[#00AFCE] transition-colors duration-200 font-montserrat ${
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={formContent?.passwordPlaceholder || "Create a password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 font-montserrat">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                <DynamicText 
                  page="organizationRegister" 
                  section="form" 
                  contentKey="confirmPasswordLabel"
                  fallback="Confirm Password"
                  as="span"
                />
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#00AFCE] focus:border-[#00AFCE] transition-colors duration-200 font-montserrat ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={formContent?.confirmPasswordPlaceholder || "Confirm your password"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 font-montserrat">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Organization Description */}
            <div>
              <label htmlFor="organizationDescription" className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                <DynamicText 
                  page="organizationRegister" 
                  section="form" 
                  contentKey="organizationDescriptionLabel"
                  fallback="Organization Description"
                  as="span"
                />
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  id="organizationDescription"
                  name="organizationDescription"
                  value={formData.organizationDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full pl-10 pr-4 py-3 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#00AFCE] focus:border-[#00AFCE] transition-colors duration-200 font-montserrat resize-none ${
                    errors.organizationDescription ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={formContent?.organizationDescriptionPlaceholder || "Tell us about your organization (e.g., mission, what you do, target demographics)"}
                ></textarea>
              </div>
              {errors.organizationDescription && (
                <p className="mt-1 text-sm text-red-600 font-montserrat">{errors.organizationDescription}</p>
              )}
            </div>

            {/* Website (Optional) */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                <DynamicText 
                  page="organizationRegister" 
                  section="form" 
                  contentKey="websiteLabel"
                  fallback="Website (Optional)"
                  as="span"
                />
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#00AFCE] focus:border-[#00AFCE] transition-colors duration-200 font-montserrat border-gray-200"
                  placeholder={formContent?.websitePlaceholder || "e.g., https://your-organization.org"}
                />
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                <DynamicText 
                  page="organizationRegister" 
                  section="form" 
                  contentKey="phoneNumberLabel"
                  fallback="Phone Number (Optional)"
                  as="span"
                />
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#00AFCE] focus:border-[#00AFCE] transition-colors duration-200 font-montserrat border-gray-200"
                  placeholder={formContent?.phoneNumberPlaceholder || "e.g., +1 555 123 4567"}
                />
              </div>
            </div>
          </div>

          {/* Register Button */}
          <PrimaryButton
            type="submit"
            className="w-full py-3 sm:py-4 mt-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Account...
              </span>
            ) : (
              <DynamicText 
                page="organizationRegister" 
                section="form" 
                contentKey="submitButton"
                fallback="Register"
                as="span"
              />
            )}
          </PrimaryButton>

          {/* Sign In Link */}
          <div className="text-center text-sm mt-4">
            <Link to="/organization-login" className="font-medium text-[#00AFCE] hover:text-[#009ac2] font-montserrat">
              <DynamicText 
                page="organizationRegister" 
                section="main" 
                contentKey="signInLink"
                fallback="Already have an account? Sign In"
                as="span"
              />
            </Link>
          </div>
          
          {/* User Auth Info Button */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <button 
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center text-sm font-medium text-[#00AFCE] hover:text-[#009ac2] font-montserrat"
            >
              <Info className="w-4 h-4 mr-1" />
              View User Authentication Documentation
            </button>
          </div>
        </form>
        </div>
      </div>
      
      {/* User Auth Modal */}
      <UserAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      <Footer />
    </div>
  );
};

export default OrganizationRegister;