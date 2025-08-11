import React, { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { tasksAPI } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { CheckSquare, Pause, Play, RefreshCw, SkipForward } from "lucide-react";

interface Task {
  _id: string;
  title: string;
  dueDate: Date | string;
  status: "not-started" | "in-progress" | "completed";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

type Mode = "work" | "shortBreak" | "longBreak";

const defaultDurations = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60 // 15 minutes
};

const PomodoroPage: React.FC = () => {
  // Timer state
  const [mode, setMode] = useState<Mode>("work");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [remaining, setRemaining] = useState<number>(defaultDurations.work);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);
  const [autoStartNext, setAutoStartNext] = useState<boolean>(true);

  // Duration settings (seconds)
  const [workDuration, setWorkDuration] = useState<number>(defaultDurations.work);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(defaultDurations.shortBreak);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(defaultDurations.longBreak);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState<number>(4);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

  // Fetch tasks
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadingTasks(true);
        const response = await tasksAPI.getAllTasks();
        const formatted = response.map((t: Task) => ({
          ...t,
          dueDate: new Date(t.dueDate),
          createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined
        }));
        setTasks(formatted);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        toast({ title: "Error", description: "Failed to load tasks", variant: "destructive" });
      } finally {
        setLoadingTasks(false);
      }
    };
    fetch();
  }, []);

  // Keep remaining time in sync when durations or mode change (if not running)
  useEffect(() => {
    if (isRunning) return;
    const duration = mode === "work" ? workDuration : mode === "shortBreak" ? shortBreakDuration : longBreakDuration;
    setRemaining(duration);
  }, [mode, workDuration, shortBreakDuration, longBreakDuration, isRunning]);

  // Tick effect
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          // Timer finished: move to next mode
          window.clearInterval(intervalRef.current!);
          intervalRef.current = null;
          handleNextPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleStartPause = () => {
    setIsRunning((r) => !r);
  };

  const handleReset = () => {
    setIsRunning(false);
    const duration = mode === "work" ? workDuration : mode === "shortBreak" ? shortBreakDuration : longBreakDuration;
    setRemaining(duration);
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    const duration = nextMode === "work" ? workDuration : nextMode === "shortBreak" ? shortBreakDuration : longBreakDuration;
    setRemaining(duration);
    setIsRunning(autoStartNext);
  };

  const handleNextPhase = () => {
    // Completed a phase
    if (mode === "work") {
      const nextCycles = cyclesCompleted + 1;
      setCyclesCompleted(nextCycles);
      const shouldLongBreak = nextCycles % cyclesBeforeLongBreak === 0;
      switchMode(shouldLongBreak ? "longBreak" : "shortBreak");
      toast({ title: shouldLongBreak ? "Long break" : "Short break", description: shouldLongBreak ? "Time for a longer rest." : "Take a quick rest." });
    } else {
      switchMode("work");
      toast({ title: "Focus session", description: "Back to work." });
    }
  };

  const skipPhase = () => {
    setIsRunning(false);
    handleNextPhase();
  };

  const totalForMode = useMemo(() => {
    return mode === "work" ? workDuration : mode === "shortBreak" ? shortBreakDuration : longBreakDuration;
  }, [mode, workDuration, shortBreakDuration, longBreakDuration]);

  const percent = useMemo(() => {
    return Math.max(0, Math.min(100, ((totalForMode - remaining) / totalForMode) * 100));
  }, [remaining, totalForMode]);

  const mmss = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const uncompletedTasks = useMemo(() => tasks.filter((t) => t.status !== "completed"), [tasks]);

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      const newStatus = task.status === "completed" ? "not-started" : "completed";
      const updated = await tasksAPI.updateTask(taskId, { status: newStatus });
      const formatted = {
        ...updated,
        dueDate: new Date(updated.dueDate),
        createdAt: updated.createdAt ? new Date(updated.createdAt) : undefined,
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt) : undefined
      } as Task;
      setTasks((prev) => prev.map((t) => (t._id === taskId ? formatted : t)));
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const setFocusTask = (taskId: string) => {
    setFocusedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pomodoro</h1>
          <p className="text-muted-foreground">Focus timer with short and long breaks, plus your to-do list.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Timer */}
          <Card>
            <CardHeader>
              <CardTitle>Timer</CardTitle>
              <CardDescription>
                Mode: {mode === "work" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break"} · Cycle {cyclesCompleted % cyclesBeforeLongBreak}/{cyclesBeforeLongBreak}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-semibold tabular-nums">{mmss(remaining)}</div>
                <Progress className="w-full" value={percent} />
                <div className="flex gap-2">
                  <Button onClick={handleStartPause}>
                    {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {isRunning ? "Pause" : "Start"}
                  </Button>
                  <Button variant="secondary" onClick={handleReset}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                  <Button variant="ghost" onClick={skipPhase}>
                    <SkipForward className="mr-2 h-4 w-4" /> Skip
                  </Button>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-4">
                  <div>
                    <div className="text-sm mb-2">Work (min)</div>
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={Math.round(workDuration / 60)}
                      onChange={(e) => setWorkDuration(Math.max(60, Math.min(180 * 60, Number(e.target.value) * 60)))}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-2">Short Break (min)</div>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={Math.round(shortBreakDuration / 60)}
                      onChange={(e) => setShortBreakDuration(Math.max(60, Math.min(60 * 60, Number(e.target.value) * 60)))}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-2">Long Break (min)</div>
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      value={Math.round(longBreakDuration / 60)}
                      onChange={(e) => setLongBreakDuration(Math.max(60, Math.min(120 * 60, Number(e.target.value) * 60)))}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-2">Cycles to long break</div>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={cyclesBeforeLongBreak}
                      onChange={(e) => setCyclesBeforeLongBreak(Math.max(1, Math.min(12, Number(e.target.value))))}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  Auto-start next phase
                  <Button
                    variant={autoStartNext ? "default" : "secondary"}
                    size="sm"
                    className="ml-2"
                    onClick={() => setAutoStartNext((v) => !v)}
                  >
                    {autoStartNext ? "On" : "Off"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks To-Do */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Tasks To-Do</CardTitle>
                <CardDescription>Select a task to focus. Check it off when done.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <div className="text-sm text-muted-foreground">Loading tasks...</div>
              ) : uncompletedTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pending tasks. Great job!</div>
              ) : (
                <div className="space-y-3">
                  {uncompletedTasks.map((task) => {
                    const isFocused = focusedTaskId === task._id;
                    return (
                      <div key={task._id} className={`flex items-center justify-between rounded-md border p-2 ${isFocused ? "border-primary" : ""}`}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={isFocused ? "default" : "secondary"}
                            size="sm"
                            onClick={() => setFocusTask(task._id)}
                          >
                            Focus
                          </Button>
                          <div className="font-medium">{task.title}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{new Date(task.dueDate as any).toLocaleDateString()}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => toggleTaskCompletion(task._id)}>
                            <CheckSquare className="h-4 w-4 mr-1" /> Done
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PomodoroPage;