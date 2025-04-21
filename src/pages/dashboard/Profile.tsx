
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AtSign, Bell, User } from "lucide-react";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    institution: "University of Technology",
    major: "Computer Science",
    bio: "Dedicated student focused on software engineering and machine learning. Looking to improve my study habits and time management skills.",
    notifications: true,
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated.",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleToggleChange = (field: string, value: boolean) => {
    setFormData({ ...formData, [field]: value });
    toast({
      title: `Notifications ${value ? 'enabled' : 'disabled'}`,
      description: `You have ${value ? 'enabled' : 'disabled'} notifications for your account.`,
    });
  };

  const handleLogout = () => {
    logout();
    // Redirect is handled in DashboardLayout
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your personal information and study profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="flex">
                      <User className="mr-2 h-4 w-4 opacity-50 mt-3" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex">
                      <AtSign className="mr-2 h-4 w-4 opacity-50 mt-3" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    <Input
                      id="institution"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major">Field of Study/Major</Label>
                    <Input
                      id="major"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications about your study activities
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={formData.notifications}
                      onCheckedChange={(checked) => handleToggleChange('notifications', checked)}
                    />
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button variant="outline" onClick={handleLogout}>Sign Out</Button>
            <Button onClick={handleProfileUpdate}>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
