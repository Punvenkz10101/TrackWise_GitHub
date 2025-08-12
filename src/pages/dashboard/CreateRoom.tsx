import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { roomAPI, CreateRoomData } from "@/lib/roomAPI";
import { toast } from "@/components/ui/use-toast";
import { Users, ArrowLeft, Video } from "lucide-react";
import { Link } from "react-router-dom";

const CreateRoom = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        topic: "",
        participantsLimit: 5
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.topic.trim()) {
            toast({
                title: "Error",
                description: "Please enter a room topic",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const roomData: CreateRoomData = {
                creator: user?.name || "Anonymous",
                topic: formData.topic.trim(),
                participantsLimit: formData.participantsLimit
            };

            const room = await roomAPI.createRoom(roomData);

            toast({
                title: "Room Created!",
                description: `Room "${room.topic}" has been created successfully`,
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
            console.error("Error creating room:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create room. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
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
                        <h1 className="text-3xl font-bold tracking-tight">Create Study Room</h1>
                        <p className="text-muted-foreground">
                            Create a new study room to collaborate with friends
                        </p>
                    </div>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Video className="h-5 w-5" />
                                New Study Room
                            </CardTitle>
                            <CardDescription>
                                Set up your study room details. You can invite friends using the room key that will be generated.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="topic">Room Topic</Label>
                                    <Input
                                        id="topic"
                                        placeholder="e.g., Math Study Session, Physics Review, etc."
                                        value={formData.topic}
                                        onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="participants">Maximum Participants</Label>
                                    <Select
                                        value={formData.participantsLimit.toString()}
                                        onValueChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            participantsLimit: parseInt(value)
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select participant limit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2">2 people</SelectItem>
                                            <SelectItem value="3">3 people</SelectItem>
                                            <SelectItem value="4">4 people</SelectItem>
                                            <SelectItem value="5">5 people</SelectItem>
                                            <SelectItem value="6">6 people</SelectItem>
                                            <SelectItem value="7">7 people</SelectItem>
                                            <SelectItem value="8">8 people</SelectItem>
                                            <SelectItem value="9">9 people</SelectItem>
                                            <SelectItem value="10">10 people</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Room will be created with you as the host</span>
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Creating Room..." : "Create Room"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CreateRoom; 