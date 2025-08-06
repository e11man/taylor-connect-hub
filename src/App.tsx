import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ContentProvider } from "@/components/content/ContentProvider";
import Index from "./pages/Index";
import About from "./pages/About";
import OrganizationLogin from "./pages/OrganizationLogin";
import OrganizationRegister from "./pages/OrganizationRegister";
import OrganizationPendingApproval from "./pages/OrganizationPendingApproval";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import TestDatabase from "./pages/TestDatabase";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ContentTest from "./pages/ContentTest";
import TestEmailVerification from "./pages/TestEmailVerification";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import UserDashboard from "./components/sections/UserDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on schema/permission errors
        if (error?.message?.includes('schema') || error?.code === '42501') {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ContentProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/organization-login" element={<OrganizationLogin />} />
                  <Route path="/organization-register" element={<OrganizationRegister />} />
                  <Route path="/organization-pending" element={<OrganizationPendingApproval />} />
                  <Route path="/organization-dashboard" element={<OrganizationDashboard />} />
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/test" element={<TestDatabase />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/content-test" element={<ContentTest />} />
                  <Route path="/test-email-verification" element={<TestEmailVerification />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ContentProvider>
            </TooltipProvider>
          </SearchProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
