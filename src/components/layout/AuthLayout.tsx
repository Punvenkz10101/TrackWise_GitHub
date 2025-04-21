
import React from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  description
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center px-4 lg:px-6 border-b">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            T
          </div>
          <span>TrackWise</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="container flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
          <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
            <div className="absolute inset-0 bg-primary/90" />
            <div className="relative z-20 flex items-center text-lg font-medium">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary">
                T
              </div>
              <span className="ml-2">TrackWise</span>
            </div>
            <div className="relative z-20 mt-auto">
              <blockquote className="space-y-2">
                <p className="text-lg">
                  "TrackWise has completely transformed how I organize my study sessions. 
                  I can track my progress and stay motivated throughout the semester."
                </p>
                <footer className="text-sm">Sarah Johnson, Computer Science Student</footer>
              </blockquote>
            </div>
          </div>
          <div className="p-8 lg:p-16 flex flex-col justify-center space-y-6 w-full max-w-md mx-auto">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
