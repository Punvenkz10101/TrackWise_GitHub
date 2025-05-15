import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  ArrowRight, 
  Book, 
  CheckSquare, 
  Target,
  Calendar,
  Bell
} from "lucide-react";
import { Link } from "react-router-dom";
import { tasksAPI, notesAPI, scheduleAPI, progressAPI } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { format, isToday, isThisWeek, isFuture, compareAsc } from "date-fns";

// Interfaces for our data
interface Task {
  _id: string;
  title: string;
  dueDate: Date;
  status: "not-started" | "in-progress" | "completed";
  createdAt?: Date;
  updatedAt?: Date;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Reminder {
  _id: string;
  title: string;
  description?: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activityData, setActivityData] = useState([]);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tasks
        const tasksResponse = await tasksAPI.getAllTasks();
        const formattedTasks = tasksResponse.map((task: Task) => ({
          ...task,
          dueDate: new Date(task.dueDate),
          createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
          updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined
        }));
        setTasks(formattedTasks);
        
        // Fetch notes
        const notesResponse = await notesAPI.getAllNotes();
        const formattedNotes = notesResponse.map((note: Note) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }));
        setNotes(formattedNotes);
        
        // Fetch reminders
        const remindersResponse = await scheduleAPI.getAllReminders();
        const formattedReminders = remindersResponse.map((reminder: Reminder) => ({
          ...reminder,
          date: new Date(reminder.date),
          createdAt: reminder.createdAt ? new Date(reminder.createdAt) : undefined,
          updatedAt: reminder.updatedAt ? new Date(reminder.updatedAt) : undefined
        }));
        setReminders(formattedReminders);
        
        // Fetch progress data for chart
        const progressResponse = await progressAPI.getDailyData(7);
        
        // Format activity data for chart
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const activityDataMap = new Map(days.map(day => [day, 0]));
        
        // Map completed tasks to days of the week
        formattedTasks.forEach(task => {
          if (task.status === 'completed' && isThisWeek(task.updatedAt || new Date())) {
            const day = format(task.updatedAt || new Date(), 'EEE');
            activityDataMap.set(day, (activityDataMap.get(day) || 0) + 1);
          }
        });
        
        // Include progress data if available
        if (progressResponse && progressResponse.length > 0) {
          progressResponse.forEach((entry: { date: string; completedTasks: number }) => {
            if (entry.date && entry.completedTasks) {
              const day = format(new Date(entry.date), 'EEE');
              activityDataMap.set(day, entry.completedTasks);
            }
          });
        }
        
        // Convert map to array for the chart
        const formattedActivityData = days.map(day => ({
          name: day,
          tasks: activityDataMap.get(day) || 0
        }));
        
        setActivityData(formattedActivityData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Calculate summary statistics
  const tasksCompletedThisWeek = tasks.filter(
    task => task.status === 'completed' && isThisWeek(task.updatedAt || new Date())
  ).length;
  
  const totalTasksThisWeek = tasks.filter(
    task => isThisWeek(task.createdAt || task.dueDate || new Date())
  ).length;
  
  const completionPercentage = totalTasksThisWeek > 0 
    ? (tasksCompletedThisWeek / totalTasksThisWeek) * 100
    : 0;
  
  // Calculate streak - consecutive days with completed tasks
  const calculateStreak = () => {
    const today = new Date();
    let streak = 0;
    let currentDate = today;
    
    // Check if there are tasks completed today
    const hasCompletedTaskToday = tasks.some(
      task => task.status === 'completed' && isToday(task.updatedAt || new Date())
    );
    
    // If no tasks completed today, start checking from yesterday
    if (!hasCompletedTaskToday) {
      currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count consecutive days with completed tasks
    let consecutiveDays = true;
    while (consecutiveDays) {
      const dateToCheck = new Date(currentDate);
      const tasksCompletedOnDate = tasks.some(task => {
        const updatedDate = task.updatedAt || new Date();
        return task.status === 'completed' && 
          updatedDate.getDate() === dateToCheck.getDate() &&
          updatedDate.getMonth() === dateToCheck.getMonth() &&
          updatedDate.getFullYear() === dateToCheck.getFullYear();
      });
      
      if (tasksCompletedOnDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        consecutiveDays = false;
      }
    }
    
    return streak;
  };
  
  const streak = calculateStreak();
  
  // Get recent tasks sorted by due date (closest first)
  const recentTasks = [...tasks]
    .filter(task => task.status !== 'completed')
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);
  
  // Notes created this week
  const notesCreatedThisWeek = notes.filter(
    note => isThisWeek(note.createdAt)
  ).length;

  // Get upcoming reminders (today and future)
  const upcomingReminders = [...reminders]
    .filter(reminder => isToday(reminder.date) || isFuture(reminder.date))
    .sort((a, b) => compareAsc(a.date, b.date))
    .slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || "Student"}</h1>
          <p className="text-muted-foreground">
            Track your study progress and manage your tasks
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            Loading dashboard data...
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tasksCompletedThisWeek}/{totalTasksThisWeek}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This week's completion rate
                  </p>
                  <Progress className="mt-2" value={completionPercentage} />
                </CardContent>
              </Card>
              
              <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Notes Created</CardTitle>
                  <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{notesCreatedThisWeek}</div>
                  <p className="text-xs text-muted-foreground">
                    Notes created this week
                  </p>
                  <Progress className="mt-2" value={notesCreatedThisWeek > 0 ? (notesCreatedThisWeek / 10) * 100 : 0} />
                </CardContent>
              </Card>
              
              <Card className="animate-fade-in" style={{ animationDelay: "300ms" }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{streak} days</div>
                  <p className="text-xs text-muted-foreground">
                    Consecutive days with tasks completed
                  </p>
                  <Progress className="mt-2" value={(streak / 7) * 100} />
                </CardContent>
              </Card>
            </div>

            {/* Charts and Tasks */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>
                    Your task completion by day
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={activityData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="tasks"
                        name="Tasks Completed"
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>
                    Your latest study tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTasks.length > 0 ? (
                      recentTasks.map((task) => (
                        <div key={task._id} className="flex items-center">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none flex items-center">
                              {task.status === 'completed' ? (
                                <CheckSquare className="mr-2 h-4 w-4 text-primary" />
                              ) : (
                                <div className="mr-2 h-4 w-4 rounded border border-primary"></div>
                              )}
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Due: {format(task.dueDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No upcoming tasks</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/tasks">
                      View all tasks
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Upcoming Reminders & Latest Notes */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Upcoming Reminders */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Upcoming Reminders</CardTitle>
                    <CardDescription>
                      Important events from your schedule
                    </CardDescription>
                  </div>
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingReminders.length > 0 ? (
                      upcomingReminders.map((reminder) => (
                        <div key={reminder._id} className="flex items-center">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{reminder.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {isToday(reminder.date) 
                                ? "Today" 
                                : format(reminder.date, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No upcoming reminders</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/schedule">
                      View calendar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Recent Notes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Recent Notes</CardTitle>
                    <CardDescription>
                      Your latest study notes
                    </CardDescription>
                  </div>
                  <Book className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notes.length > 0 ? (
                      [...notes]
                        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                        .slice(0, 3)
                        .map((note) => (
                          <div key={note._id} className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <Book className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">{note.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Updated {format(note.updatedAt, 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No notes created yet</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/notes">
                      View all notes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
