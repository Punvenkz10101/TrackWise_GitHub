import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Video, Users, Plus, LogIn, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Rooms = () => {
    const { user } = useAuth();

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Study Rooms</h1>
                    <p className="text-muted-foreground">
                        Create or join study rooms to collaborate with friends
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Create Room Card */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Create New Room</CardTitle>
                                    <CardDescription>
                                        Start a new study session and invite friends
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Video className="h-4 w-4" />
                                    <span>Video chat with friends</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Up to 10 participants</span>
                                </div>
                            </div>

                            <Button asChild className="w-full">
                                <Link to="/rooms/create">
                                    Create Room
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Join Room Card */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <LogIn className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Join Existing Room</CardTitle>
                                    <CardDescription>
                                        Join a friend's study session using a room key
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Video className="h-4 w-4" />
                                    <span>Connect with friends</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Real-time collaboration</span>
                                </div>
                            </div>

                            <Button asChild variant="outline" className="w-full">
                                <Link to="/rooms/join">
                                    Join Room
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Features Section */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Study Room Features</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <Video className="h-4 w-4 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Video Chat</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    High-quality video and audio communication with your study partners
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <Users className="h-4 w-4 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Shared Timers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Synchronized Pomodoro timers and break sessions for everyone
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <Plus className="h-4 w-4 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Task Sharing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Collaborative task lists and progress tracking
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* How it works */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">How it Works</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold mx-auto">
                                1
                            </div>
                            <h3 className="font-semibold">Create or Join</h3>
                            <p className="text-sm text-muted-foreground">
                                Create a new room or join an existing one using a room key
                            </p>
                        </div>

                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold mx-auto">
                                2
                            </div>
                            <h3 className="font-semibold">Invite Friends</h3>
                            <p className="text-sm text-muted-foreground">
                                Share the room key with your study partners
                            </p>
                        </div>

                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold mx-auto">
                                3
                            </div>
                            <h3 className="font-semibold">Study Together</h3>
                            <p className="text-sm text-muted-foreground">
                                Use video chat, timers, and shared features to study effectively
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Rooms; 