
import React, { useState } from "react";
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
  Target 
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for dashboard stats
const mockActivityData = [
  { name: "Mon", tasks: 3 },
  { name: "Tue", tasks: 5 },
  { name: "Wed", tasks: 2 },
  { name: "Thu", tasks: 6 },
  { name: "Fri", tasks: 4 },
  { name: "Sat", tasks: 1 },
  { name: "Sun", tasks: 2 },
];

const mockRecentTasks = [
  { id: "1", title: "Read chapter 5", completed: true, dueDate: "2023-04-15" },
  { id: "2", title: "Complete practice quiz", completed: false, dueDate: "2023-04-16" },
  { id: "3", title: "Study vocabulary", completed: false, dueDate: "2023-04-17" },
];

const Dashboard = () => {
  const { user } = useAuth();
  
  // Calculate summary statistics
  const tasksCompletedThisWeek = 12;
  const totalTasksThisWeek = 20;
  const completionPercentage = (tasksCompletedThisWeek / totalTasksThisWeek) * 100;
  const streak = 4; // Consecutive days with completed tasks

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || "Student"}</h1>
          <p className="text-muted-foreground">
            Track your study progress and manage your tasks
          </p>
        </div>

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
                +2 from yesterday
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
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">
                +3 from last week
              </p>
              <Progress className="mt-2" value={85} />
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
                +1 from yesterday
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
                <BarChart data={mockActivityData}>
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
                {mockRecentTasks.map((task) => (
                  <div key={task.id} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center">
                        {task.completed ? (
                          <CheckSquare className="mr-2 h-4 w-4 text-primary" />
                        ) : (
                          <div className="mr-2 h-4 w-4 rounded border border-primary"></div>
                        )}
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
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
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
