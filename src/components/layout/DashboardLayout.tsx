import React, { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home, CheckSquare, Book, Calendar,
  MessageCircle, User, Moon, Sun, LogOut, Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider
} from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { logout, user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Preserve current path on page load/refresh
  useEffect(() => {
    if (location.pathname) {
      localStorage.setItem('currentPath', location.pathname);
    }
  }, [location.pathname]);

  // Preserve current path when app state changes
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem('lastLocation', location.pathname);
    }
  }, [location, isAuthenticated]);

  // Handle manual logout
  const handleLogout = () => {
    // Clear location data when intentionally logging out
    sessionStorage.removeItem('lastLocation');
    localStorage.removeItem('currentPath');
    logout();
    navigate("/login");
  };

  const navItems = [
    { title: "Dashboard", icon: Home, path: "/dashboard" },
    { title: "Tasks", icon: CheckSquare, path: "/tasks" },
    { title: "Notes", icon: Book, path: "/notes" },
    { title: "Schedule", icon: Calendar, path: "/schedule" },
    { title: "Rooms", icon: Users, path: "/rooms" },
    { title: "Chatbot", icon: MessageCircle, path: "/chatbot" },

  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader className="flex items-center h-14 px-4 border-b">
            <div className="font-semibold text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                T
              </div>
              <span>TrackWise</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative ${isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border-l-4 border-cyan-400"
                              : "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:shadow-md hover:scale-[1.02] hover:border-l-4 hover:border-cyan-400 border-l-4 border-transparent"
                            }`
                          }
                        >
                          <item.icon className={`w-5 h-5 transition-transform duration-200 ${location.pathname === item.path ? 'scale-110' : 'group-hover:scale-110'
                            }`} />
                          <span className="font-medium">{item.title}</span>
                          {/* Hover tooltip */}
                          <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-sidebar-accent-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {item.title}
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{user?.name || 'User'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 p-6 overflow-auto">
          <SidebarTrigger className="absolute top-4 left-4 z-10 md:hidden" />
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
