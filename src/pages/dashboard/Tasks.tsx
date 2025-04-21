
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Check, Edit, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Task schema
const taskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  dueDate: z.date(),
  status: z.enum(["not-started", "in-progress", "completed"]).default("not-started"),
});

type Task = z.infer<typeof taskSchema> & { id: string };

// Mock initial tasks
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Study calculus chapter 5",
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    status: "not-started",
  },
  {
    id: "2",
    title: "Complete programming assignment",
    dueDate: new Date(Date.now() + 2 * 86400000), // Day after tomorrow
    status: "in-progress",
  },
  {
    id: "3",
    title: "Review notes for midterm",
    dueDate: new Date(Date.now() + 5 * 86400000), // 5 days from now
    status: "not-started",
  },
  {
    id: "4",
    title: "Prepare presentation for class",
    dueDate: new Date(Date.now() - 1 * 86400000), // Yesterday (overdue)
    status: "in-progress",
  },
  {
    id: "5",
    title: "Read research paper",
    dueDate: new Date(Date.now() - 3 * 86400000), // 3 days ago (completed)
    status: "completed",
  },
];

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      status: "not-started",
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isAddDialogOpen) {
      if (editingTask) {
        form.reset({
          title: editingTask.title,
          dueDate: editingTask.dueDate,
          status: editingTask.status,
        });
      } else {
        form.reset({
          title: "",
          status: "not-started",
        });
      }
    }
  }, [isAddDialogOpen, editingTask, form]);

  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    if (editingTask) {
      // Update existing task
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? { ...task, ...data } : task
      ));
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    } else {
      // Add new task
      const newTask: Task = {
        id: Date.now().toString(),
        ...data,
      };
      setTasks([...tasks, newTask]);
      toast({
        title: "Task added",
        description: "Your new task has been added successfully.",
      });
    }
    setIsAddDialogOpen(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsAddDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
      title: "Task deleted",
      description: "Your task has been deleted.",
    });
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === "completed" ? "not-started" : "completed";
        return { ...task, status: newStatus };
      }
      return task;
    }));
  };

  const getStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Completed</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">In Progress</Badge>;
      case "not-started":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">Not Started</Badge>;
      default:
        return null;
    }
  };

  const isTaskOverdue = (dueDate: Date, status: Task["status"]) => {
    return new Date() > dueDate && status !== "completed";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track your study tasks
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTask(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
                <DialogDescription>
                  {editingTask 
                    ? "Update your task details below." 
                    : "Create a new task to track your study progress."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter task title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Select a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            {...field}
                          >
                            <option value="not-started">Not Started</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} type="button">
                      Cancel
                    </Button>
                    <Button type="submit">{editingTask ? "Update Task" : "Add Task"}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Study Tasks</CardTitle>
            <CardDescription>
              View and manage all your study tasks in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={() => handleToggleComplete(task.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        task.status === "completed" ? "line-through text-muted-foreground" : ""
                      )}>
                        {task.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          isTaskOverdue(task.dueDate, task.status) 
                            ? "text-destructive font-medium" 
                            : ""
                        )}
                      >
                        {format(task.dueDate, "MMM dd, yyyy")}
                        {isTaskOverdue(task.dueDate, task.status) && 
                          <span className="ml-2 text-xs">(Overdue)</span>
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditTask(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No tasks found. Click "Add Task" to create your first task.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
