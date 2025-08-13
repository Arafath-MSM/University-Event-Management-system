import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";


import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PasswordRecovery from "./pages/auth/PasswordRecovery";
import ResetPassword from "./pages/auth/ResetPassword";

// Dashboard Pages
import UserDashboard from "./pages/dashboards/UserDashboard";
import ServiceProviderDashboard from "./pages/dashboards/ServiceProviderDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ViceChancellorDashboard from "./pages/dashboards/ViceChancellorDashboard";
import UniversityAdministrationDashboard from "./pages/dashboards/UniversityAdministrationDashboard";
import StudentUnionDashboard from "./pages/dashboards/StudentUnionDashboard";
import WardenDashboard from "./pages/dashboards/WardenDashboard";

// Feature Pages
import VenueManagement from "./pages/VenueManagement";
import BookingSystem from "./pages/BookingSystem";
import EventPlanning from "./pages/EventPlanning";
import AdminTools from "./pages/AdminTools";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";

// Public Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import About from "./pages/About";
import ContactUs from "./pages/ContactUs";
import FAQs from "./pages/FAQs";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Test Component
import ApiTest from "./components/ApiTest";

const queryClient = new QueryClient();

// Dashboard Switcher Component
function DashboardSwitcher() {
  const auth = useAuth();
  const user = auth && auth.user;
  console.log('Current user:', user); // Debug log
  
  if (user) {
    if (user.role === 'vice-chancellor') return <ViceChancellorDashboard />;
    if (user.role === 'administration') return <UniversityAdministrationDashboard />;
    if (user.role === 'student-union') return <StudentUnionDashboard />;
    if (user.role === 'warden') return <WardenDashboard />;
    if (user.role === 'service-provider') return <ServiceProviderDashboard />;
    if (user.role === 'super-admin') return <AdminDashboard />;
  }
  return <UserDashboard />;
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Main App Component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
                    <Route path="/password-recovery" element={<PasswordRecovery />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/features" element={<Features />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            
            {/* API Test Route - Remove this after testing */}
            <Route path="/api-test" element={<ApiTest />} />
            
            {/* Main Dashboard Route */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['student', 'faculty', 'service-provider', 'vice-chancellor', 'administration', 'student-union', 'warden', 'super-admin']}>
                <DashboardSwitcher />
              </ProtectedRoute>
            } />
            
            {/* Individual Dashboard Routes */}
            <Route path="/dashboards/service-provider" element={
              <ProtectedRoute allowedRoles={['service-provider']}>
                <ServiceProviderDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboards/vice-chancellor" element={
              <ProtectedRoute allowedRoles={['vice-chancellor']}>
                <ViceChancellorDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboards/administration" element={
              <ProtectedRoute allowedRoles={['administration']}>
                <UniversityAdministrationDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboards/student-union" element={
              <ProtectedRoute allowedRoles={['student-union']}>
                <StudentUnionDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboards/warden" element={
              <ProtectedRoute allowedRoles={['warden']}>
                <WardenDashboard />
              </ProtectedRoute>
            } />
            
            {/* Feature Routes */}
            <Route path="/venues" element={
              <ProtectedRoute allowedRoles={['student', 'faculty', 'service-provider', 'super-admin']}>
                <VenueManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/booking" element={
              <ProtectedRoute allowedRoles={['student', 'faculty', 'service-provider']}>
                <BookingSystem />
              </ProtectedRoute>
            } />
            
            <Route path="/event-planning" element={
              <ProtectedRoute allowedRoles={['student', 'faculty', 'service-provider']}>
                <EventPlanning />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/tools" element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <AdminTools />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <Reports />
              </ProtectedRoute>
            } />
            
            {/* Profile Route */}
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['student', 'faculty', 'service-provider', 'vice-chancellor', 'administration', 'student-union', 'warden', 'super-admin']}>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Error Routes */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
                  <p className="text-xl text-gray-600">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
