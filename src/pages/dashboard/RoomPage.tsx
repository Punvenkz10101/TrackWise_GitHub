import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { v4 as uuidv4 } from "uuid";
import { BiTrash, BiEdit, BiFullscreen } from "react-icons/bi";
import socketService from "@/lib/socketService";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Whiteboard from "@/components/Whiteboard";
import {
    Users,
    Copy,
    LogOut,
    Play,
    Pause,
    RotateCcw,
    Clock,
    CheckSquare,
    Plus,
    X,
    PenTool,
    Video,
    Mic,
    MicOff,
    VideoOff
} from "lucide-react";

interface Task {
    id: string;
    text: string;
    completed?: boolean;
}

interface PomodoroState {
    isRunning: boolean;
    timeLeft: number;
    duration: number;
}

interface BreakState {
    isRunning: boolean;
    timeLeft: number;
    duration: number;
}

export default function RoomPage() {
    const { roomKey } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    // Ensure these values have default fallbacks
    const creator = state?.creator || state?.username || "";
    const topic = state?.topic || "Study Room";
    const username = state?.username || creator || "";

    // Initialize state with default values
    const [tasks, setTasks] = useState<Task[]>([]);
    const [members, setMembers] = useState<Array<string | { username: string, userId: string, authenticated: boolean }>>([]);
    const [currentTask, setCurrentTask] = useState("");
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [selectedMinutes, setSelectedMinutes] = useState(25);
    const [pomodoroState, setPomodoroState] = useState<PomodoroState>({
        isRunning: false,
        timeLeft: 0,
        duration: 0,
    });
    const [sessionCount, setSessionCount] = useState(0);
    const meetingContainerRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(30);
    const [breakState, setBreakState] = useState<BreakState>({
        isRunning: false,
        timeLeft: 0,
        duration: 0,
    });
    const [selectedBreakMinutes, setSelectedBreakMinutes] = useState(5);
    const [breakSessionCount, setBreakSessionCount] = useState(0);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [finalRoomKey, setFinalRoomKey] = useState<string>(roomKey || "");


    // Memoize tasks to prevent unnecessary re-renders
    const memoizedTasks = useMemo(() => {
        return Array.isArray(tasks) ? tasks : [];
    }, [tasks]);

    useEffect(() => {
        // New Zego Cloud credentials with proper token generation
        const appId = 1340321224;
        const serverSecret = "87e627c261c65ff8dfb664d60194a975";

        // Generate a proper user ID and room ID
        const userID = uuidv4();
        const roomID = roomKey || uuidv4();

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appId,
            serverSecret,
            roomID,
            userID,
            username
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);

        zp.joinRoom({
            container: meetingContainerRef.current,
            scenario: {
                mode: ZegoUIKitPrebuilt.VideoConference,
            },
            turnOnMicrophoneWhenJoining: false,
            turnOnCameraWhenJoining: false,
            showMyCameraToggleButton: true,
            showMyMicrophoneToggleButton: true,
            showAudioVideoSettingsButton: true,
            showScreenSharingButton: true,
            showTextChat: true,
            showUserList: true,
            maxUsers: 50,
            layout: "Auto",
            showLayoutButton: true,
        });

        // Store the Zego instance for later use
        (window as any).zegoInstance = zp;

        // Cleanup function
        return () => {
            try {
                if (meetingContainerRef.current) {
                    meetingContainerRef.current.innerHTML = "";
                }
            } catch (error) {
                console.error("Error during cleanup:", error);
            }
        };
    }, [roomKey, username, topic]);

    useEffect(() => {
        // Initialize socket connection
        const socket = socketService.connect();

        if (!socket) {
            console.error('Failed to establish connection');
            setConnectionError("Failed to establish connection");
            return;
        }

        // Join room
        socket.emit("joinRoom", { roomKey, username });

        // Handle connection events
        socket.on("connect", () => {
            setConnectionError(null);
            setIsConnecting(false);
        });

        socket.on("connect_error", (error) => {
            setConnectionError("Failed to connect to server. Please try again.");
            setIsConnecting(false);
            toast({
                title: "Connection Error",
                description: "Failed to connect to server. Retrying...",
                variant: "destructive",
            });
        });

        // Listen for duration updates from other users
        socket.on("durationUpdated", (data) => {
            setSelectedMinutes(data.duration);
            setPomodoroState((prev) => ({
                ...prev,
                timeLeft: data.duration * 60,
                duration: data.duration * 60,
            }));
        });

        // Handle initial Pomodoro state when joining
        const handlePomodoroState = ({
            running,
            timeLeft,
            duration,
            sessionCount,
        }: any) => {
            setPomodoroState({
                isRunning: running,
                timeLeft: timeLeft,
                duration: duration,
            });
            if (typeof sessionCount === "number") {
                setSessionCount(sessionCount);
            }
        };
        socket.on("pomodoroState", handlePomodoroState);

        // Handle timer start
        const handlePomodoroStarted = ({
            running,
            timeLeft,
            duration,
            sessionCount,
        }: any) => {
            setPomodoroState({
                isRunning: running,
                timeLeft: timeLeft,
                duration: duration,
            });
            if (typeof sessionCount === "number") {
                setSessionCount(sessionCount);
            }
        };
        socket.on("pomodoroStarted", handlePomodoroStarted);

        // Handle timer ticks
        const handlePomodoroTick = ({ timeLeft, running }: any) => {
            setPomodoroState((prev) => ({
                ...prev,
                timeLeft: timeLeft,
                isRunning: running,
            }));
        };
        socket.on("pomodoroTick", handlePomodoroTick);

        // Handle timer pause
        const handlePomodoroPaused = ({ running, timeLeft, sessionCount }: any) => {
            setPomodoroState((prev) => ({
                ...prev,
                isRunning: running,
                timeLeft: timeLeft,
            }));
            if (typeof sessionCount === "number") {
                setSessionCount(sessionCount);
            }
        };
        socket.on("pomodoroPaused", handlePomodoroPaused);

        // Handle timer reset
        const handlePomodoroReset = ({ running, timeLeft, sessionCount }: any) => {
            setPomodoroState({
                isRunning: running,
                timeLeft: timeLeft,
                duration: 0,
            });
            if (typeof sessionCount === "number") {
                setSessionCount(sessionCount);
            }
        };
        socket.on("pomodoroReset", handlePomodoroReset);

        // Handle timer completion
        const handlePomodoroComplete = ({ sessionCount }: any) => {
            setPomodoroState((prev) => ({
                ...prev,
                isRunning: false,
                timeLeft: 0,
            }));
            if (typeof sessionCount === "number") {
                setSessionCount(sessionCount);
            }
        };
        socket.on("pomodoroComplete", handlePomodoroComplete);

        // Handle session count updates
        const handleSessionCountUpdate = ({ sessionCount }: any) => {
            if (typeof sessionCount === "number") {
                setSessionCount(sessionCount);
            }
        };
        socket.on("sessionCountUpdate", handleSessionCountUpdate);

        // Room event handlers
        const handleRoomJoined = ({ members = [], tasks = [], roomKey: serverRoomKey }: any) => {
            setMembers(members);
            setTasks(tasks);
            if (serverRoomKey) {
                setFinalRoomKey(serverRoomKey);
            }
        };

        const handleUserJoined = ({ username, members = [] }: any) => {
            // Store member objects directly (server now sends full objects)
            setMembers(members);
        };

        const handleUserLeft = ({ username }: any) => {
            // Handle both string usernames and user objects for backward compatibility
            const leavingUsername = typeof username === 'string' ? username : username?.username;
            setMembers((prev) =>
                (prev || []).filter((member) => member !== leavingUsername)
            );
        };

        // Task event handlers
        const handleTaskAdded = (taskData: any) => {
            try {
                if (typeof taskData === "string") {
                    setTasks((prev) => [
                        ...(prev || []),
                        {
                            id: uuidv4(),
                            text: taskData,
                            completed: false,
                        },
                    ]);
                } else if (typeof taskData === "object" && taskData.text) {
                    setTasks((prev) => [
                        ...(prev || []),
                        {
                            id: taskData.id || uuidv4(),
                            text: taskData.text,
                            completed: taskData.completed || false,
                        },
                    ]);
                }
            } catch (error) {
                console.error("Error adding task:", error);
            }
        };

        const handleTaskDeleted = (taskId: string) => {
            setTasks((prev) => (prev || []).filter((task) => task.id !== taskId));
        };

        const handleTaskEdited = ({ taskId, newText }: any) => {
            setTasks((prev) =>
                (prev || []).map((task) =>
                    task.id === taskId ? { ...task, text: newText } : task
                )
            );
        };

        const handleTaskToggled = ({ taskId, completed }: any) => {
            setTasks((prev) =>
                (prev || []).map((task) =>
                    task.id === taskId ? { ...task, completed } : task
                )
            );
        };

        // Break timer event handlers
        const handleBreakState = ({
            running,
            timeLeft,
            duration,
            sessionCount,
        }: any) => {
            setBreakState({
                isRunning: running,
                timeLeft: timeLeft,
                duration: duration,
            });
            if (typeof sessionCount === "number") {
                setBreakSessionCount(sessionCount);
            }
        };

        const handleBreakStarted = ({
            running,
            timeLeft,
            duration,
            sessionCount,
        }: any) => {
            setBreakState({
                isRunning: running,
                timeLeft: timeLeft,
                duration: duration,
            });
            if (typeof sessionCount === "number") {
                setBreakSessionCount(sessionCount);
            }
        };

        const handleBreakTick = ({ timeLeft, running }: any) => {
            setBreakState((prev) => ({
                ...prev,
                timeLeft: timeLeft,
                isRunning: running,
            }));
        };

        const handleBreakComplete = ({ sessionCount }: any) => {
            setBreakState((prev) => ({
                ...prev,
                isRunning: false,
                timeLeft: 0,
            }));
            if (typeof sessionCount === "number") {
                setBreakSessionCount(sessionCount);
            }
        };

        // Listen for break duration updates from other users
        socket.on("breakDurationUpdated", (data) => {
            setSelectedBreakMinutes(data.duration);
            setBreakState((prev) => ({
                ...prev,
                timeLeft: data.duration * 60,
                duration: data.duration * 60,
            }));
        });

        // Listen for task updates
        socket.on("tasksUpdated", ({ tasks }: any) => {
            setTasks(tasks);
        });

        // Attach event listeners
        socket.on("roomJoined", handleRoomJoined);
        socket.on("userJoined", handleUserJoined);
        socket.on("userLeft", handleUserLeft);
        socket.on("taskAdded", handleTaskAdded);
        socket.on("taskDeleted", handleTaskDeleted);
        socket.on("taskEdited", handleTaskEdited);
        socket.on("taskToggled", handleTaskToggled);
        socket.on("breakState", handleBreakState);
        socket.on("breakStarted", handleBreakStarted);
        socket.on("breakTick", handleBreakTick);
        socket.on("breakComplete", handleBreakComplete);

        // Cleanup function
        return () => {
            socket.off("pomodoroState", handlePomodoroState);
            socket.off("pomodoroStarted", handlePomodoroStarted);
            socket.off("pomodoroTick", handlePomodoroTick);
            socket.off("pomodoroPaused", handlePomodoroPaused);
            socket.off("pomodoroReset", handlePomodoroReset);
            socket.off("pomodoroComplete", handlePomodoroComplete);
            socket.off("sessionCountUpdate", handleSessionCountUpdate);
            socket.off("roomJoined", handleRoomJoined);
            socket.off("userJoined", handleUserJoined);
            socket.off("userLeft", handleUserLeft);
            socket.off("taskAdded", handleTaskAdded);
            socket.off("taskDeleted", handleTaskDeleted);
            socket.off("taskEdited", handleTaskEdited);
            socket.off("taskToggled", handleTaskToggled);
            socket.off("breakState", handleBreakState);
            socket.off("breakStarted", handleBreakStarted);
            socket.off("breakTick", handleBreakTick);
            socket.off("breakComplete", handleBreakComplete);
            socket.off("breakDurationUpdated");
            socket.off("tasksUpdated");

            socketService.disconnect();
        };
    }, [roomKey, username]);

    const toggleFullscreen = () => {
        const element = meetingContainerRef.current;
        if (!document.fullscreenElement) {
            element?.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    const startPomodoro = () => {
        if (pomodoroState.timeLeft > 0 && pomodoroState.isRunning === false) {
            socketService.emit("startPomodoro", {
                roomKey: finalRoomKey,
                duration: pomodoroState.timeLeft,
            });
        } else {
            const duration = selectedMinutes * 60;
            socketService.emit("startPomodoro", {
                roomKey: finalRoomKey,
                duration: duration,
            });
        }
    };

    const pausePomodoro = () => {
        socketService.emit("pausePomodoro", { roomKey: finalRoomKey });
    };

    const resetPomodoro = () => {
        socketService.emit("resetPomodoro", { roomKey: finalRoomKey });
    };

    const addTask = () => {
        if (currentTask.trim()) {
            if (editingTaskId !== null) {
                socketService.emit("editTask", {
                    roomKey: finalRoomKey,
                    taskId: editingTaskId,
                    newText: currentTask.trim(),
                });
                setEditingTaskId(null);
            } else {
                socketService.emit("addTask", {
                    roomKey: finalRoomKey,
                    task: currentTask.trim(),
                });
            }
            setCurrentTask("");
        }
    };

    const deleteTask = (taskId: string) => {
        socketService.emit("deleteTask", {
            roomKey: finalRoomKey,
            taskId,
        });
    };

    const toggleTask = (taskId: string, completed: boolean) => {
        socketService.emit("toggleTask", {
            roomKey: finalRoomKey,
            taskId,
            completed,
        });
    };

    const startEditingTask = (task: Task) => {
        setEditingTaskId(task.id);
        setCurrentTask(typeof task === "string" ? task : task.text);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomKey || "");
        toast({
            title: "Room Key Copied!",
            description: "Room key has been copied to clipboard",
        });
    };

    const leaveRoom = async () => {
        try {
            // Clean up Zego instance if available
            try {
                const zgInstance = (window as any).zegoInstance;
                if (zgInstance && typeof zgInstance.leaveRoom === 'function') {
                    if (typeof zgInstance.stopScreenSharing === 'function') {
                        await zgInstance.stopScreenSharing();
                    }
                    await zgInstance.leaveRoom();
                    if (typeof zgInstance.destroy === 'function') {
                        await zgInstance.destroy();
                    }
                    (window as any).zegoInstance = null;
                }
            } catch (zegoError) {
                // Error cleaning up Zego
            }

            if (meetingContainerRef.current) {
                meetingContainerRef.current.innerHTML = '';
            }

            if (socketService.getSocket()) {
                socketService.emit("leaveRoom", { roomKey: finalRoomKey, username });
                socketService.disconnect();
            }

            if (pomodoroState.isRunning) {
                resetPomodoro();
            }

            setTimeout(() => {
                window.location.href = '/rooms';
            }, 100);

        } catch (error) {
            console.error("Error leaving the room:", error);
            if (meetingContainerRef.current) {
                meetingContainerRef.current.innerHTML = '';
            }
            window.location.href = '/rooms';
        }
    };

    const startBreak = () => {
        const duration =
            breakState.timeLeft > 0 && !breakState.isRunning
                ? breakState.timeLeft
                : selectedBreakMinutes * 60;

        socketService.emit("startBreak", {
            roomKey: finalRoomKey,
            duration: duration,
        });
    };

    const pauseBreak = () => {
        socketService.emit("pauseBreak", { roomKey: finalRoomKey });
    };

    const resetBreak = () => {
        socketService.emit("resetBreak", { roomKey: finalRoomKey });
    };

    const handleBreakDurationChange = (newDuration: number) => {
        socketService.emit("changeBreakDuration", {
            roomId: finalRoomKey,
            duration: newDuration,
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };



    return (
        <div className="min-h-screen bg-background">
            {connectionError && (
                <div className="bg-destructive/80 text-destructive-foreground px-4 py-2 text-center">
                    {connectionError}
                </div>
            )}

            {/* Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={leaveRoom}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Leave Room
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold">{topic}</h1>
                                <p className="text-sm text-muted-foreground">
                                    Room Key: {roomKey}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={copyToClipboard}
                                        className="ml-2 h-6 px-2"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowWhiteboard(true)}
                            >
                                <PenTool className="h-4 w-4 mr-2" />
                                Whiteboard
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                {members.length} members
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                {/* Top Row - Meeting Details, Timers, and Todo */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    {/* Meeting Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Participants
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {members.map((member, index) => {
                                    const memberName = typeof member === 'string' ? member : member.username;
                                    return (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span>{memberName}</span>
                                            <div className="flex gap-1">
                                                {memberName === username && (
                                                    <Badge variant="secondary" className="text-xs">You</Badge>
                                                )}
                                                {memberName === creator && (
                                                    <Badge variant="default" className="text-xs">Host</Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pomodoro Timer */}
                    <Card className="bg-black text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Clock className="h-5 w-5" />
                                Pomodoro Timer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-white">
                                    {formatTime(pomodoroState.timeLeft)}
                                </div>
                                <p className="text-sm text-gray-300">
                                    Sessions: {sessionCount}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <select
                                    value={selectedMinutes}
                                    onChange={(e) => {
                                        const newDuration = Number(e.target.value);
                                        setSelectedMinutes(newDuration);
                                        socketService.emit("changeDuration", {
                                            roomId: finalRoomKey,
                                            duration: newDuration,
                                        });
                                        setPomodoroState({
                                            isRunning: false,
                                            timeLeft: newDuration * 60,
                                            duration: newDuration * 60,
                                        });
                                    }}
                                    className="w-full p-2 border rounded-md bg-gray-800 text-white border-gray-600"
                                    disabled={pomodoroState.isRunning}
                                >
                                    <option value={5}>5 Minutes</option>
                                    <option value={10}>10 Minutes</option>
                                    <option value={15}>15 Minutes</option>
                                    <option value={20}>20 Minutes</option>
                                    <option value={25}>25 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={35}>35 Minutes</option>
                                    <option value={40}>40 Minutes</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={50}>50 Minutes</option>
                                    <option value={55}>55 Minutes</option>
                                    <option value={60}>60 Minutes</option>
                                </select>

                                <div className="flex gap-2">
                                    {!pomodoroState.isRunning ? (
                                        <Button onClick={startPomodoro} className="flex-1 bg-[rgb(15,217,217)] hover:bg-[rgb(12,180,180)] text-white">
                                            <Play className="h-4 w-4 mr-2" />
                                            Start
                                        </Button>
                                    ) : (
                                        <Button onClick={pausePomodoro} className="flex-1 bg-[rgb(15,217,217)] hover:bg-[rgb(12,180,180)] text-white">
                                            <Pause className="h-4 w-4 mr-2" />
                                            Pause
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={resetPomodoro} className="border-gray-600 text-white hover:bg-gray-800">
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Break Timer */}
                    <Card className="bg-black text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Clock className="h-5 w-5" />
                                Break Timer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-white">
                                    {formatTime(breakState.timeLeft)}
                                </div>
                                <p className="text-sm text-gray-300">
                                    Break Sessions: {breakSessionCount}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <select
                                    value={selectedBreakMinutes}
                                    onChange={(e) => handleBreakDurationChange(Number(e.target.value))}
                                    className="w-full p-2 border rounded-md bg-gray-800 text-white border-gray-600"
                                    disabled={breakState.isRunning}
                                >
                                    <option value={5}>5 Minutes</option>
                                    <option value={10}>10 Minutes</option>
                                    <option value={15}>15 Minutes</option>
                                </select>

                                <div className="flex gap-2">
                                    {!breakState.isRunning ? (
                                        <Button onClick={startBreak} className="flex-1 bg-[rgb(15,217,217)] hover:bg-[rgb(12,180,180)] text-white">
                                            <Play className="h-4 w-4 mr-2" />
                                            Start Break
                                        </Button>
                                    ) : (
                                        <Button onClick={pauseBreak} className="flex-1 bg-[rgb(15,217,217)] hover:bg-[rgb(12,180,180)] text-white">
                                            <Pause className="h-4 w-4 mr-2" />
                                            Pause Break
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={resetBreak} className="border-gray-600 text-white hover:bg-gray-800">
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5" />
                                Shared Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    addTask();
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={currentTask}
                                    onChange={(e) => setCurrentTask(e.target.value)}
                                    placeholder={editingTaskId ? "Edit task..." : "Add a new task"}
                                    className="flex-1"
                                />
                                <Button type="submit" size="sm" className="bg-[rgb(15,217,217)] hover:bg-[rgb(12,180,180)] text-white">
                                    {editingTaskId ? <BiEdit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </Button>
                                {editingTaskId && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setEditingTaskId(null);
                                            setCurrentTask("");
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </form>

                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {memoizedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-2 bg-muted rounded-md group"
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <Checkbox
                                                checked={task.completed || false}
                                                onCheckedChange={(checked) =>
                                                    toggleTask(task.id, checked as boolean)
                                                }
                                                className="data-[state=checked]:bg-[rgb(15,217,217)] data-[state=checked]:border-[rgb(15,217,217)]"
                                            />
                                            <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                                {typeof task === "string" ? task : task.text}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => startEditingTask(task)}
                                            >
                                                <BiEdit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteTask(task.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Row - Video Call */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Video className="h-5 w-5" />
                                Video Conference
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleFullscreen}
                                className="bg-[rgb(15,217,217)] hover:bg-[rgb(12,180,180)] text-white border-[rgb(15,217,217)]"
                            >
                                <BiFullscreen className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full h-[350px] bg-muted rounded-lg overflow-hidden">
                            <div
                                ref={meetingContainerRef}
                                className="absolute inset-0 w-full h-full zego-container"
                                style={{
                                    aspectRatio: '16/9',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {showWhiteboard && (
                <Whiteboard
                    roomId={roomKey || ""}
                    onClose={() => setShowWhiteboard(false)}
                />
            )}
        </div>
    );
} 