
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Check, CheckCircle, Target, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";

// Mock data generation for charts
const generateDailyProgressData = (days: number) => {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, "MMM dd"),
      completedTasks: Math.floor(Math.random() * 8) + 1,
      studyHours: Number((Math.random() * 6 + 2).toFixed(1)),
    });
  }
  return data;
};

const generateWeeklyProgressData = (weeks: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = subDays(today, i * 7);
    data.push({
      week: `Week ${weeks - i}`,
      completedTasks: Math.floor(Math.random() * 20) + 10,
      studyHours: Number((Math.random() * 15 + 10).toFixed(1)),
    });
  }
  return data;
};

const subjectCompletionData = [
  { name: "Mathematics", value: 85 },
  { name: "Science", value: 70 },
  { name: "History", value: 60 },
  { name: "English", value: 90 },
  { name: "Computer Science", value: 75 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

// Task completion status data
const taskCompletionData = [
  { name: "Completed", value: 65 },
  { name: "In Progress", value: 20 },
  { name: "Not Started", value: 15 },
];

const pieColors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const ProgressPage = () => {
  const [timeRange, setTimeRange] = useState("7days");
  
  // Generate data based on selected time range
  const dailyData = generateDailyProgressData(
    timeRange === "7days" ? 7 : timeRange === "14days" ? 14 : 30
  );
  
  const weeklyData = generateWeeklyProgressData(
    timeRange === "7days" ? 1 : timeRange === "14days" ? 2 : 4
  );

  // Calculate overall progress metrics
  const totalTasks = dailyData.reduce((sum, day) => sum + day.completedTasks, 0);
  const totalHours = dailyData.reduce((sum, day) => sum + day.studyHours, 0);
  const averageHoursPerDay = totalHours / dailyData.length;
  
  // Calculate streak days (consecutive days with completed tasks)
  let streak = 0;
  for (let i = dailyData.length - 1; i >= 0; i--) {
    if (dailyData[i].completedTasks > 0) {
      streak++;
    } else {
      break;
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Progress Tracking</h1>
            <p className="text-muted-foreground">
              Track your study progress and achievements
            </p>
          </div>
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="14days">Last 14 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <Progress className="mt-2" value={(totalTasks / (dailyData.length * 5)) * 100} />
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Study Hours</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
              <Progress className="mt-2" value={(totalHours / (dailyData.length * 8)) * 100} />
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Hours/Day</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageHoursPerDay.toFixed(1)}</div>
              <Progress className="mt-2" value={(averageHoursPerDay / 8) * 100} />
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streak} days</div>
              <Progress className="mt-2" value={(streak / dailyData.length) * 100} />
            </CardContent>
          </Card>
        </div>

        {/* Charts section */}
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">Daily Progress</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Study Progress</CardTitle>
                <CardDescription>
                  Track your daily completed tasks and study hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="completedTasks"
                        name="Tasks Completed"
                        stroke="hsl(var(--primary))"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="studyHours"
                        name="Study Hours"
                        stroke="hsl(var(--accent-foreground))"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Study Progress</CardTitle>
                <CardDescription>
                  Weekly aggregated study metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="completedTasks"
                        name="Tasks Completed"
                        fill="hsl(var(--primary))"
                      />
                      <Bar
                        dataKey="studyHours"
                        name="Study Hours"
                        fill="hsl(var(--accent-foreground))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subjects" className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Subject Completion</CardTitle>
                <CardDescription>
                  Percentage completion by subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectCompletionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {subjectCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Status</CardTitle>
                <CardDescription>
                  Distribution of task completion status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskCompletionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {taskCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {taskCompletionData.map((status, index) => (
                    <div key={status.name} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: pieColors[index] }}
                      />
                      <span className="text-sm">{status.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;
