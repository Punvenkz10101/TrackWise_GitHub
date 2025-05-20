import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      title: 'Task Scheduler',
      description: 'Plan your study sessions with our intuitive task scheduler. Set due dates and track your progress.',
      icon: CheckCircle,
    },
    {
      title: 'Notes Storage',
      description: 'Keep all your study notes organized in one place with our powerful text editor.',
      icon: CheckCircle,
    },
    {
      title: 'Progress Tracking',
      description: 'Visualize your study progress with beautiful charts and statistics.',
      icon: CheckCircle,
    },
    {
      title: 'AI Chatbot',
      description: 'Get help from our AI assistant when you\'re stuck on a problem.',
      icon: CheckCircle,
    }
  ];

  const handleLoginClick = () => {
    // Clear any redirects that might skip the login page
    sessionStorage.removeItem('redirectAfterLogin');
    localStorage.removeItem('currentPath');
    navigate('/login');
  };

  const handleSignupClick = () => {
    // Clear any redirects that might skip the signup page
    sessionStorage.removeItem('redirectAfterLogin');
    localStorage.removeItem('currentPath');
    navigate('/signup');
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-16 items-center px-4 lg:px-6 border-b">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            T
          </div>
          <span>TrackWise</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" onClick={handleLoginClick}>
            Login
          </Button>
          <Button className="animate-pulse-light" onClick={handleSignupClick}>
            Sign Up
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                  Boost Your Study Productivity with AI
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  TrackWise is your all-in-one study companion. Plan, organize, and track your progress with our intuitive platform.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" className="animate-fade-in" onClick={handleSignupClick}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="animate-fade-in delay-200" onClick={handleLoginClick}>
                  Login
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[500px] h-[400px] hidden lg:block">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/20 to-purple-400/20 rounded-lg border backdrop-blur-sm"></div>
                <div className="absolute top-4 left-4 right-4 bottom-4 bg-card rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary mr-2"></div>
                      <div className="font-medium">TrackWise Dashboard</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="h-20 bg-muted rounded"></div>
                      <div className="h-20 bg-muted rounded"></div>
                      <div className="h-20 bg-muted rounded"></div>
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Everything You Need to Succeed
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform provides all the tools you need to organize and optimize your study sessions.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex animate-fade-in flex-col items-center space-y-2 rounded-lg border p-4 transition-all hover:shadow-md"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-primary text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-primary to-purple-600 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Transform Your Study Habits?
              </h2>
              <p className="max-w-[600px] text-primary-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of students who have improved their productivity with TrackWise.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" variant="secondary" className="hover:bg-white" onClick={handleSignupClick}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2025 TrackWise. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link to="/about" className="text-xs hover:underline underline-offset-4">
            About
          </Link>
          <Link to="/contact" className="text-xs hover:underline underline-offset-4">
            Contact
          </Link>
          <Link to="/privacy" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
};

export default LandingPage;
