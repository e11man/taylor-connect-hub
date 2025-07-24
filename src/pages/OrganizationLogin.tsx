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

const OrganizationLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if this is an organization user by looking at their organization profile
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (orgError || !orgData) {
        await supabase.auth.signOut();
        throw new Error('This account is not registered as an organization');
      }

      toast({
        title: "Success!",
        description: "Welcome back to your organization dashboard.",
      });

      navigate('/organization-dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
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
                Organization Login
              </h1>
              <p className="text-lg text-muted-foreground font-montserrat">
                Access your organization dashboard
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 h-12 border-2 border-gray-200 rounded-xl font-montserrat focus:border-[#00AFCE] focus:ring-[#00AFCE] transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-montserrat font-semibold text-primary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-12 border-2 border-gray-200 rounded-xl font-montserrat focus:border-[#00AFCE] focus:ring-[#00AFCE] transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <PrimaryButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#00AFCE] hover:bg-[#00AFCE]/90 text-white font-montserrat font-semibold text-base rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </PrimaryButton>

                {/* Forgot Password */}
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-[#00AFCE] hover:text-[#00AFCE]/80 font-montserrat font-medium transition-colors duration-200"
                    onClick={() => setForgotPasswordModalOpen(true)}
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </div>

            {/* Register Link */}
            <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <p className="text-muted-foreground font-montserrat">
                Don't have an account?{' '}
                <Link
                  to="/organization-register"
                  className="text-[#00AFCE] hover:text-[#00AFCE]/80 font-semibold transition-colors duration-200"
                >
                  Register
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-primary font-montserrat transition-colors duration-200"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <ForgotPasswordModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
      />
      
      <Footer />
    </div>
  );
};

export default OrganizationLogin;