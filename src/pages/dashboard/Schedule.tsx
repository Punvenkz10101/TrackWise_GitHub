import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Bell, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { scheduleAPI } from "@/lib/api";

interface Reminder {
  _id: string;
  title: string;
  description?: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const SchedulePage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReminder, setNewReminder] = useState({ title: "", description: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch reminders on component mount
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setLoading(true);
        const response = await scheduleAPI.getAllReminders();
        
        // Convert string dates to Date objects
        const formattedReminders = response.map((reminder: Reminder) => ({
          ...reminder,
          date: new Date(reminder.date),
          createdAt: reminder.createdAt ? new Date(reminder.createdAt) : undefined,
          updatedAt: reminder.updatedAt ? new Date(reminder.updatedAt) : undefined
        }));
        
        setReminders(formattedReminders);
      } catch (error) {
        console.error("Error fetching reminders:", error);
        
        let errorTitle = "Error";
        let errorMessage = "Failed to load schedule data";
        
        // Show different message for specific error types
        if (error instanceof Error) {
          if (error.message.includes('Authentication')) {
            errorTitle = "Authentication Error";
            errorMessage = "Your session may have expired. Please refresh the page or log in again.";
          } else if (error.message.includes('connect to server')) {
            errorTitle = "Connection Error";
            errorMessage = "Could not connect to the server. Please check that the server is running.";
          } else if (error.message.includes('timed out')) {
            errorTitle = "Timeout Error";
            errorMessage = "The request timed out. Please try again later.";
          }
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, []);
  
  // Get reminders for selected date
  const selectedDateReminders = reminders.filter(
    (reminder) => date && reminder.date.toDateString() === date.toDateString()
  );

  const handleAddReminder = async () => {
    if (!date || !newReminder.title) return;
    
    try {
      const response = await scheduleAPI.createReminder({
        title: newReminder.title,
        description: newReminder.description || undefined,
        date: date
      });
      
      const formattedReminder = {
        ...response,
        date: new Date(response.date),
        createdAt: response.createdAt ? new Date(response.createdAt) : undefined,
        updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined
      };
      
      setReminders([...reminders, formattedReminder]);
      setNewReminder({ title: "", description: "" });
      setDialogOpen(false);
      
      toast({
        title: "Reminder added",
        description: `Added reminder for ${date.toLocaleDateString()}`,
      });
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      console.log('Deleting reminder with ID:', id);
      await scheduleAPI.deleteReminder(id);
      
      setReminders(reminders.filter(reminder => reminder._id !== id));
      
      toast({
        title: "Reminder deleted",
        description: "Your reminder has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting reminder:", error);
      
      // Display more informative error message
      let errorMessage = "Failed to delete reminder";
      let errorTitle = "Error";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error types
        if (errorMessage.includes('Invalid reminder ID format')) {
          errorTitle = "Invalid Reminder ID";
          errorMessage = "The reminder ID format is invalid.";
        } else if (errorMessage.includes('Reminder not found')) {
          errorTitle = "Reminder Not Found";
          errorMessage = "The reminder may have been already deleted.";
          
          // Remove from state if not found on server
          setReminders(reminders.filter(reminder => reminder._id !== id));
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Highlight dates with reminders
  const reminderDates = reminders.map(r => new Date(r.date));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Manage your study schedule and reminders
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view or add reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-full"
                modifiers={{
                  hasReminder: reminderDates
                }}
                modifiersStyles={{
                  hasReminder: {
                    backgroundColor: "hsl(var(--primary) / 0.15)",
                    fontWeight: "bold"
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Reminders</CardTitle>
                <CardDescription>
                  {date ? date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Select a date"}
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Reminder</DialogTitle>
                    <DialogDescription>
                      Add a reminder for {date?.toLocaleDateString()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Exam revision"
                        value={newReminder.title}
                        onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        placeholder="Review chapters 3-5"
                        value={newReminder.description}
                        onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddReminder}>Save Reminder</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-6 text-muted-foreground">
                  Loading reminders...
                </div>
              ) : selectedDateReminders.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Bell className="mx-auto h-10 w-10 opacity-20 mb-2" />
                  <p>No reminders for this date</p>
                  <p className="text-sm">Click 'Add Reminder' to create one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateReminders.map((reminder) => (
                    <div key={reminder._id} className="flex items-start justify-between border rounded-md p-3">
                      <div>
                        <h4 className="font-medium">{reminder.title}</h4>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground">{reminder.description}</p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteReminder(reminder._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchedulePage;
