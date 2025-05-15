import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Check, CheckCircle, Target, TrendingUp, Plus, Save, X } from "lucide-react";
import { format, subDays, parseISO, isToday } from "date-fns";
import { progressAPI, tasksAPI } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define interfaces for data types
interface ProgressData {
  date: string;
  completedTasks: number;
  studyHours: number;
}

interface SubjectProgress {
  name: string;
  value: number;
}

interface ProgressSummary {
  totalTasks: number;
  totalHours: number;
  averageHoursPerDay: number;
  streak: number;
  tasksByStatus: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  daysTracked: number;
}

interface TodayEntry {
  _id?: string;
  date: Date;
  studyHours: number;
  completedTasks: number;
  subjects?: SubjectProgress[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];
const pieColors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

// Schema for progress entry form
const progressEntrySchema = z.object({
  studyHours: z.string().transform((val) => parseFloat(val)).refine(
    (val) => !isNaN(val) && val >= 0 && val <= 24,
    { message: "Hours must be between 0 and 24" }
  ),
  completedTasks: z.string().transform((val) => parseInt(val, 10)).refine(
    (val) => !isNaN(val) && val >= 0,
    { message: "Tasks must be a non-negative number" }
  ),
  subjects: z.array(
    z.object({
      name: z.string().min(1, "Subject name is required"),
      value: z.string().transform((val) => parseFloat(val)).refine(
        (val) => !isNaN(val) && val >= 0,
        { message: "Hours must be a non-negative number" }
      )
    })
  ).optional().default([])
});

// Define the type for the form values before transformation
type ProgressFormValues = {
  studyHours: string;
  completedTasks: string;
  subjects: { name: string; value: string }[];
};

// Type for API request after transformation
interface ProgressApiData {
  date: Date;
  completedTasks: number;
  studyHours: number;
  subjects: Array<{ name: string; value: number }>;
}

const ProgressPage = () => {
  const [timeRange, setTimeRange] = useState("7days");
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<ProgressData[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectProgress[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary>({
    totalTasks: 0,
    totalHours: 0,
    averageHoursPerDay: 0,
    streak: 0,
    tasksByStatus: {
      completed: 0,
      inProgress: 0,
      notStarted: 0
    },
    daysTracked: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [todayEntry, setTodayEntry] = useState<TodayEntry | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  
  // Setup the form with proper types
  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressEntrySchema),
    defaultValues: {
      studyHours: "0",
      completedTasks: "0",
      subjects: []
    },
  });

  // Fetch progress data when time range changes
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const days = timeRange === "7days" ? 7 : timeRange === "14days" ? 14 : 30;
        
        // Fetch daily progress data
        const dailyResponse = await progressAPI.getDailyData(days);
        setDailyData(dailyResponse);
        
        // Fetch progress summary
        const summaryResponse = await progressAPI.getSummary(days);
        setProgressSummary(summaryResponse);
        
        // Fetch all progress to get subject data
        const allProgress = await progressAPI.getAllProgress();
        
        // Extract today's entry if it exists
        const today = new Date();
        const todayString = format(today, 'yyyy-MM-dd');
        const todayEntryData = allProgress.find((entry: TodayEntry) => {
          const entryDate = new Date(entry.date);
          return format(entryDate, 'yyyy-MM-dd') === todayString;
        });
        
        if (todayEntryData) {
          setTodayEntry({
            ...todayEntryData,
            date: new Date(todayEntryData.date)
          });
          
          // If today's entry exists, populate the form with string values for the form
          form.reset({
            studyHours: todayEntryData.studyHours.toString(),
            completedTasks: todayEntryData.completedTasks.toString(),
            subjects: todayEntryData.subjects?.map(subj => ({
              name: subj.name,
              value: subj.value.toString()
            })) || []
          });
        }
        
        // Extract and aggregate subject data
        const subjectMap = new Map<string, number>();
        const subjectSet = new Set<string>();
        
        allProgress.forEach((entry: TodayEntry) => {
          if (entry.subjects && entry.subjects.length > 0) {
            entry.subjects.forEach((subject: SubjectProgress) => {
              const currentValue = subjectMap.get(subject.name) || 0;
              subjectMap.set(subject.name, currentValue + subject.value);
              subjectSet.add(subject.name);
            });
          }
        });
        
        // Set the list of known subjects for autocomplete
        setSubjects(Array.from(subjectSet));
        
        const formattedSubjectData = Array.from(subjectMap.entries()).map(([name, value]) => ({
          name,
          value
        }));
        
        setSubjectData(formattedSubjectData);
        
        // Get completed tasks count
        const tasksResponse = await tasksAPI.getAllTasks();
        const completedTasksCount = tasksResponse.filter((task: { status: string }) => task.status === "completed").length;
        
        // If no entry for today, set completed tasks count
        if (!todayEntryData) {
          form.setValue("completedTasks", completedTasksCount.toString());
        }
        
      } catch (error) {
        console.error("Error fetching progress data:", error);
        
        // Show different message for auth errors
        if (error instanceof Error && error.message === 'Authentication failed') {
          toast({
            title: "Authentication Error",
            description: "Your session may have expired. Please refresh the page or log in again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load progress data",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [timeRange, form]);

  // Handle form submission
  const onSubmit = async (data: ProgressFormValues) => {
    try {
      // Format the data with proper type conversions
      const progressData: ProgressApiData = {
        date: new Date(),
        studyHours: parseFloat(data.studyHours),
        completedTasks: parseInt(data.completedTasks, 10),
        subjects: data.subjects.map(subject => ({
          name: subject.name,
          value: parseFloat(subject.value)
        }))
      };
      
      // Save to API
      await progressAPI.saveProgress(progressData);
      
      // Refresh data
      const days = timeRange === "7days" ? 7 : timeRange === "14days" ? 14 : 30;
      const dailyResponse = await progressAPI.getDailyData(days);
      setDailyData(dailyResponse);
      
      // Update summary data
      const summaryResponse = await progressAPI.getSummary(days);
      setProgressSummary(summaryResponse);
      
      // Update today's entry
      setTodayEntry({
        ...progressData,
        date: new Date()
      });
      
      // Close dialog
      setIsDialogOpen(false);
      
      toast({
        title: "Progress saved",
        description: "Your study progress has been recorded",
      });
    } catch (error) {
      console.error("Error saving progress:", error);
      toast({
        title: "Error",
        description: "Failed to save progress data",
        variant: "destructive",
      });
    }
  };
  
  // Add a subject to the form with correct typing
  const addSubject = () => {
    if (!newSubject.trim()) return;
    
    const currentSubjects = form.getValues().subjects || [];
    const exists = currentSubjects.some(s => s.name === newSubject);
    
    if (!exists) {
      form.setValue("subjects", [
        ...currentSubjects,
        { name: newSubject, value: "0" }
      ]);
    }
    
    setNewSubject("");
  };
  
  // Remove a subject from the form
  const removeSubject = (index: number) => {
    const currentSubjects = form.getValues().subjects || [];
    const newSubjects = [...currentSubjects];
    newSubjects.splice(index, 1);
    form.setValue("subjects", newSubjects);
  };

  // Generate weekly data from daily data
  interface WeeklyDataItem {
    week: string;
    completedTasks: number;
    studyHours: number;
  }

  const weeklyData = React.useMemo<WeeklyDataItem[]>(() => {
    const weeks = timeRange === "7days" ? 1 : timeRange === "14days" ? 2 : 4;
    const result: WeeklyDataItem[] = [];
    
    // Group daily data into weeks
    for (let i = 0; i < weeks; i++) {
      const weekStart = i * 7;
      const weekEnd = Math.min(weekStart + 7, dailyData.length);
      const weekData = dailyData.slice(weekStart, weekEnd);
      
      const completedTasks = weekData.reduce((sum, day) => sum + day.completedTasks, 0);
      const studyHours = weekData.reduce((sum, day) => sum + day.studyHours, 0);
      
      result.push({
        week: `Week ${i + 1}`,
        completedTasks,
        studyHours
      });
    }
    
    return result;
  }, [dailyData, timeRange]);

  // Task completion status data
  const taskCompletionData = [
    { name: "Completed", value: progressSummary.tasksByStatus.completed },
    { name: "In Progress", value: progressSummary.tasksByStatus.inProgress },
    { name: "Not Started", value: progressSummary.tasksByStatus.notStarted },
  ];

  // Format subject data for better display labels
  const formattedSubjectData = subjectData.map(subject => ({
    ...subject,
    name: subject.name.length > 15 ? `${subject.name.substring(0, 15)}...` : subject.name
  }));

  // Function to render custom label for pie chart
  interface PieChartLabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieChartLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

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
          <div className="flex items-center gap-4">
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
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {todayEntry ? "Update Today's Progress" : "Record Progress"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{todayEntry ? "Update Today's Progress" : "Record Today's Progress"}</DialogTitle>
                  <DialogDescription>
                    Track your study hours and completed tasks for today
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="studyHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Study Hours</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.5" min="0" max="24" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="completedTasks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completed Tasks</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <Label>Subjects Studied</Label>
                      <div className="flex gap-2">
                        <Select onValueChange={setNewSubject}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select or type a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input 
                          value={newSubject} 
                          onChange={e => setNewSubject(e.target.value)} 
                          placeholder="Or type new subject"
                          className="flex-1"
                        />
                        <Button type="button" onClick={addSubject} variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        {form.getValues().subjects?.map((subject, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                            <div className="flex-1">{subject.name}</div>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              className="w-[100px]"
                              value={subject.value}
                              onChange={(e) => {
                                const subjects = [...(form.getValues().subjects || [])];
                                subjects[index] = {
                                  ...subjects[index],
                                  value: e.target.value
                                };
                                form.setValue("subjects", subjects);
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSubject(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit">Save Progress</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            Loading progress data...
          </div>
        ) : (
          <>
            {/* Today's Entry */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="mr-2">Today's Progress</div>
                  {todayEntry && (
                    <Badge variant="outline" className="bg-primary/10">
                      <Check className="mr-1 h-3 w-3" /> Recorded
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {todayEntry 
                    ? `You've studied for ${todayEntry.studyHours} hours and completed ${todayEntry.completedTasks} tasks today`
                    : "Record your study progress for today"}
                </CardDescription>
              </CardHeader>
              {todayEntry && todayEntry.subjects && todayEntry.subjects.length > 0 && (
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {todayEntry.subjects.map((subject: SubjectProgress, index: number) => (
                      <Badge key={index} variant="secondary">
                        {subject.name}: {subject.value} hrs
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
              <CardFooter>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  variant={todayEntry ? "outline" : "default"}
                >
                  {todayEntry ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Today's Progress
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Record Progress
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{progressSummary.totalTasks}</div>
                  <Progress className="mt-2" value={(progressSummary.totalTasks / (dailyData.length * 5)) * 100} />
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
                  <div className="text-2xl font-bold">{progressSummary.totalHours.toFixed(1)}</div>
                  <Progress className="mt-2" value={(progressSummary.totalHours / (dailyData.length * 8)) * 100} />
                </CardContent>
              </Card>
              
              <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Hours/Day</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{progressSummary.averageHoursPerDay.toFixed(1)}</div>
                  <Progress className="mt-2" value={(progressSummary.averageHoursPerDay / 8) * 100} />
                </CardContent>
              </Card>
              
              <Card className="animate-fade-in" style={{ animationDelay: "300ms" }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{progressSummary.streak} days</div>
                  <Progress className="mt-2" value={(progressSummary.streak / dailyData.length) * 100} />
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
              
              <TabsContent value="subjects" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Subject Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Subject Distribution</CardTitle>
                      <CardDescription>
                        Time spent on different subjects
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {subjectData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie
                              data={formattedSubjectData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={renderCustomizedLabel}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {formattedSubjectData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} hours`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex justify-center items-center h-[240px]">
                          <p className="text-muted-foreground">No subject data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Task Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Status</CardTitle>
                      <CardDescription>
                        Overview of task completion status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={taskCompletionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {taskCompletionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;
