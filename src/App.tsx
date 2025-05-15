import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

// Pages
import LandingPage from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/dashboard/Dashboard";
import TasksPage from "./pages/dashboard/Tasks";
import NotesPage from "./pages/dashboard/Notes";
import SchedulePage from "./pages/dashboard/Schedule";
import ChatbotPage from "./pages/dashboard/Chatbot";
import ProfilePage from "./pages/dashboard/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  // Wait for authentication to be checked
  useEffect(() => {
    // Short timeout to ensure auth state is fully initialized
    const timer = setTimeout(() => {
      setIsAuthChecked(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Don't render anything until authentication is checked
  if (!isAuthChecked) {
    return null;
  }
  
  // If not authenticated, save the current location and redirect to login
  if (!isAuthenticated) {
    // Store the current path to redirect back after login
    // Only if this isn't already the login page (to prevent redirect loops)
    if (location.pathname !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

// Route handler for authentication pages (redirect if already logged in)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  // Wait for authentication to be checked
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthChecked(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Don't render anything until authentication is checked
  if (!isAuthChecked) {
    return null;
  }
  
  // If already authenticated, redirect to dashboard or saved location
  if (isAuthenticated) {
    const savedPath = localStorage.getItem('currentPath') || '/dashboard';
    return <Navigate to={savedPath} replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      <Route path="/signup" element={
        <AuthRoute>
          <Signup />
        </AuthRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute>
          <TasksPage />
        </ProtectedRoute>
      } />
      <Route path="/notes" element={
        <ProtectedRoute>
          <NotesPage />
        </ProtectedRoute>
      } />
      <Route path="/schedule" element={
        <ProtectedRoute>
          <SchedulePage />
        </ProtectedRoute>
      } />
      <Route path="/chatbot" element={
        <ProtectedRoute>
          <ChatbotPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
