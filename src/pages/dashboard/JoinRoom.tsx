import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { roomAPI } from "@/lib/roomAPI";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Video, Users, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";

const JoinRoom = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [roomKey, setRoomKey] = useState("");
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomKey.trim()) {
            toast({
                title: "Error",
                description: "Please enter a room key",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const room = await roomAPI.joinRoom({
                roomKey: roomKey.trim(),
                username: user?.name || "Anonymous"
            });

            toast({
                title: "Room Joined!",
                description: `Successfully joined "${room.topic}"`,
            });

            // Navigate to the room with the room data
            navigate(`/room/${room.roomKey}`, {
                state: {
                    creator: room.creator,
                    topic: room.topic,
                    username: user?.name || "Anonymous"
                }
            });

        } catch (error: any) {
            console.error("Error joining room:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to join room. Please check the room key and try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: "Copied!",
            description: "Room key copied to clipboard",
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/rooms">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Rooms
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Join Study Room</h1>
                        <p className="text-muted-foreground">
                            Join an existing study room using a room key
                        </p>
                    </div>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Video className="h-5 w-5" />
                                Join Study Room
                            </CardTitle>
                            <CardDescription>
                                Enter the room key provided by your friend to join their study session.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="roomKey">Room Key</Label>
                                    <Input
                                        id="roomKey"
                                        placeholder="Enter room key (e.g., a1b2c3d4)"
                                        value={roomKey}
                                        onChange={(e) => setRoomKey(e.target.value)}
                                        required
                                        className="font-mono"
                                    />
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>You'll join as: {user?.name || "Anonymous"}</span>
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Joining Room..." : "Join Room"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Help section */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-lg">How to join a room?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium">1. Get the room key</h4>
                                <p className="text-sm text-muted-foreground">
                                    Ask your friend to share the room key with you. It's a short code like "a1b2c3d4".
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium">2. Enter the key</h4>
                                <p className="text-sm text-muted-foreground">
                                    Type the room key in the input field above and click "Join Room".
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium">3. Start studying together</h4>
                                <p className="text-sm text-muted-foreground">
                                    Once joined, you'll be able to use video chat, shared timers, and collaborative features.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default JoinRoom; 