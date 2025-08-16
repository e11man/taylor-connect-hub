import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useContent } from "@/hooks/useContent";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from '@/contexts/AuthContext';
import { DynamicText } from '@/components/content/DynamicText';
import { ForgotPasswordModal } from '@/components/modals/ForgotPasswordModal';
import { usePageTitle } from "@/hooks/usePageTitle";

const OrganizationLogin = () => {
  usePageTitle("Organization Login");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const { content: pageTitle } = useContent('organizationLogin', 'title', 'default', 'Organization Login');
  const { content: pageDescription } = useContent('organizationLogin', 'description', 'default', 'Sign in to your organization account');
  const { content: emailLabel } = useContent('organizationLogin', 'form', 'emailLabel', 'Email');
  const { content: passwordLabel } = useContent('organizationLogin', 'form', 'passwordLabel', 'Password');
  const { content: submitButton } = useContent('organizationLogin', 'form', 'submitButton', 'Sign In');
  const { content: signingIn } = useContent('organizationLogin', 'form', 'signingIn', 'Signing in...');
  const { content: emailPlaceholder } = useContent('organizationLogin', 'form', 'emailPlaceholder', 'Enter your email');
  const { content: passwordPlaceholder } = useContent('organizationLogin', 'form', 'passwordPlaceholder', 'Enter your password');
  const { content: noAccountPrompt } = useContent('organizationLogin', 'links', 'noAccountPrompt', <DynamicText page="auth" section="login" contentKey="no_account" fallback=<DynamicText page="auth" section="login" contentKey="no_account_text" fallback="Don't have an account?" /> />);
  const { content: signUpLink } = useContent('organizationLogin', 'links', 'signUp', 'Sign up');
  const { content: forgotPasswordLink } = useContent('organizationLogin', 'links', 'forgotPassword', 'Forgot password?');
  const { content: successTitle } = useContent('organizationLogin', 'messages', 'successTitle', 'Welcome Back!');
  const { content: successDescription } = useContent('organizationLogin', 'messages', 'successDescription', 'Successfully signed in to your organization account.');
  const { content: errorTitle } = useContent('organizationLogin', 'messages', 'errorTitle', 'Sign In Failed');
  const { content: errorNotOrganization } = useContent('organizationLogin', 'messages', 'errorNotOrganization', 'This email is not associated with an organization account.');
  const { content: errorBlocked } = useContent('organizationLogin', 'messages', 'errorBlocked', 'Your organization account has been blocked. Please contact support.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("🔑 Starting organization login process for:", email);
      
      // Use AuthContext signIn method to properly update session
      const { data, error } = await signIn(email, password);

      if (error) {
        console.error("❌ Auth error:", error);
        throw new Error(error.message);
      }

      // Check if this is an organization user
      if (data?.session?.user?.user_type !== 'organization') {
        throw new Error(errorNotOrganization);
      }

      console.log("✅ Organization login successful:", {
        orgId: data.session.user.id,
        email: data.session.user.email,
        status: data.session.user.status
      });

      toast({
        title: successTitle,
        description: successDescription,
      });

      // Redirection is now handled automatically in AuthContext
    } catch (error: any) {
      console.error("❌ Organization login failed:", error);
      
      toast({
        title: errorTitle,
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="section-padding">
        <div className="container-custom">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8 animate-slide-up">
              <div className="w-16 h-16 bg-[#00AFCE] rounded-2xl flex items-center justify-center mx-auto mb-6">
                {/* Removed Lock icon as per new_code */}
              </div>
              <h1 className="text-3xl md:text-4xl font-montserrat font-bold mb-4 text-primary">
                <DynamicText page="organizationLogin" section="title" contentKey="default" fallback=<DynamicText page="organizationLogin" section="page" contentKey="title" fallback="Organization Login" /> />
              </h1>
              <p className="text-lg text-muted-foreground font-montserrat">
                <DynamicText page="organizationLogin" section="description" contentKey="default" fallback="Sign in to your organization account" />
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    {emailLabel}
                  </label>
                  <div className="relative">
                    {/* Removed Mail icon as per new_code */}
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={emailPlaceholder}
                      className="pl-10 h-12 border-2 border-gray-200 rounded-xl font-montserrat focus:border-[#00AFCE] focus:ring-[#00AFCE] transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    {passwordLabel}
                  </label>
                  <div className="relative">
                    {/* Removed Lock icon as per new_code */}
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={passwordPlaceholder}
                      className="pl-10 pr-12 h-12 border-2 border-gray-200 rounded-xl font-montserrat focus:border-[#00AFCE] focus:ring-[#00AFCE] transition-all duration-300"
                      required
                    />
                    {/* Removed Show/Hide Password button as per new_code */}
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground font-montserrat font-medium transition-colors"
                    onClick={() => setForgotPasswordModalOpen(true)}
                  >
                    {forgotPasswordLink}
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 font-montserrat font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? signingIn : submitButton}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground font-montserrat">
                  {noAccountPrompt}{" "}
                  <Link
                    to="/organization-register"
                    className="text-[#00AFCE] hover:text-[#00AFCE]/80 font-semibold transition-colors"
                  >
                    {signUpLink}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      <ForgotPasswordModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
      />
    </div>
  );
};

export default OrganizationLogin;