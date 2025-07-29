import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ForgotPasswordModal } from "@/components/modals/ForgotPasswordModal";
import { DynamicText } from "@/components/content/DynamicText";
import { useContent, useContentSection } from "@/hooks/useContent";
import { debugOrganizationLookup, logDebugResults } from "@/utils/debugOrganizationLookup";

const OrganizationLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { content: formContent } = useContentSection('organizationLogin', 'form');
  const { content: successTitle } = useContent('organizationLogin', 'messages', 'successTitle', 'Success!');
  const { content: successDescription } = useContent('organizationLogin', 'messages', 'successDescription', 'Welcome back to your organization dashboard.');
  const { content: errorTitle } = useContent('organizationLogin', 'messages', 'errorTitle', 'Error');
  const { content: errorNotOrganization } = useContent('organizationLogin', 'messages', 'errorNotOrganization', 'This account is not registered as an organization');
  const { content: errorPending } = useContent('organizationLogin', 'messages', 'errorPending', 'Your organization is pending approval. Please wait for admin approval.');
  const { content: errorBlocked } = useContent('organizationLogin', 'messages', 'errorBlocked', 'Your organization account has been blocked. Please contact support.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("🔑 Starting organization login process for:", email);
      
      // Step 1: Authenticate user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Auth error:", error);
        throw error;
      }

      console.log("✅ User authenticated:", data.user.id);

      // Step 2: Check organization profile with enhanced error handling
      console.log("🔍 Looking up organization for user_id:", data.user.id);
      
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, user_id, name, status, contact_email')
        .eq('user_id', data.user.id)
        .maybeSingle();

      console.log("🏢 Organization lookup result:", { 
        orgData, 
        orgError,
        userEmail: data.user.email,
        userId: data.user.id 
      });

      if (orgError) {
        console.error("❌ Organization lookup failed:", orgError);
        
        // Run debug process for detailed analysis
        const debugResults = await debugOrganizationLookup(email);
        logDebugResults(debugResults, email);
        
        await supabase.auth.signOut();
        
        if (orgError.code === 'PGRST116') {
          // No rows returned - organization doesn't exist
          throw new Error(errorNotOrganization);
        } else {
          // Other errors (likely RLS or database issues)
          throw new Error(`Organization lookup failed: ${orgError.message}`);
        }
      }

      if (!orgData) {
        console.error("❌ No organization data returned");
        await supabase.auth.signOut();
        throw new Error(errorNotOrganization);
      }

      // Step 3: Check organization status
      console.log("📋 Organization status check:", orgData.status);
      
      if (orgData.status === 'pending') {
        throw new Error(errorPending);
      }
      
      if (orgData.status === 'blocked') {
        throw new Error(errorBlocked);
      }
      
      if (orgData.status !== 'approved') {
        throw new Error(`Organization status: ${orgData.status}. Contact admin for assistance.`);
      }

      console.log("✅ Organization login successful:", {
        orgId: orgData.id,
        orgName: orgData.name,
        status: orgData.status
      });

      toast({
        title: successTitle,
        description: successDescription,
      });

      navigate('/organization-dashboard');
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
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-montserrat font-bold mb-4 text-primary">
                <DynamicText 
                  page="organizationLogin" 
                  section="main" 
                  contentKey="title"
                  fallback="Organization Login"
                  as="span"
                />
              </h1>
              <p className="text-lg text-muted-foreground font-montserrat">
                <DynamicText 
                  page="organizationLogin" 
                  section="main" 
                  contentKey="subtitle"
                  fallback="Access your organization dashboard"
                  as="span"
                />
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    <DynamicText 
                      page="organizationLogin" 
                      section="form" 
                      contentKey="emailLabel"
                      fallback="Email"
                      as="span"
                    />
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={formContent.emailPlaceholder || "Enter your email"}
                      className="pl-10 h-12 border-2 border-gray-200 rounded-xl font-montserrat focus:border-[#00AFCE] focus:ring-[#00AFCE] transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    <DynamicText 
                      page="organizationLogin" 
                      section="form" 
                      contentKey="passwordLabel"
                      fallback="Password"
                      as="span"
                    />
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={formContent.passwordPlaceholder || "Enter your password"}
                      className="pl-10 pr-12 h-12 border-2 border-gray-200 rounded-xl font-montserrat focus:border-[#00AFCE] focus:ring-[#00AFCE] transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordModalOpen(true)}
                    className="text-sm text-[#00AFCE] hover:text-[#00AFCE]/80 font-montserrat font-medium transition-colors"
                  >
                    <DynamicText 
                      page="organizationLogin" 
                      section="form" 
                      contentKey="forgotPassword"
                      fallback="Forgot your password?"
                      as="span"
                    />
                  </button>
                </div>

                {/* Submit Button */}
                <PrimaryButton
                  type="submit"
                  className="w-full h-12 font-montserrat font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <DynamicText 
                      page="organizationLogin" 
                      section="form" 
                      contentKey="signingIn"
                      fallback="Signing in..."
                      as="span"
                    />
                  ) : (
                    <DynamicText 
                      page="organizationLogin" 
                      section="form" 
                      contentKey="submitButton"
                      fallback="Sign In"
                      as="span"
                    />
                  )}
                </PrimaryButton>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground font-montserrat">
                  <DynamicText 
                    page="organizationLogin" 
                    section="main" 
                    contentKey="noAccountText"
                    fallback="Don't have an account?"
                    as="span"
                  />{" "}
                  <Link
                    to="/organization-register"
                    className="text-[#00AFCE] hover:text-[#00AFCE]/80 font-semibold transition-colors"
                  >
                    <DynamicText 
                      page="organizationLogin" 
                      section="main" 
                      contentKey="signUpLink"
                      fallback="Sign up"
                      as="span"
                    />
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