
import React, { useState } from "react";
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

// Mock reminders for demo
const initialReminders = [
  { id: "1", date: new Date("2025-04-20"), title: "Project submission", description: "Submit final project" },
  { id: "2", date: new Date("2025-04-25"), title: "Study session", description: "Review chapter 7-9" },
];

const SchedulePage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reminders, setReminders] = useState(initialReminders);
  const [newReminder, setNewReminder] = useState({ title: "", description: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Get reminders for selected date
  const selectedDateReminders = reminders.filter(
    (reminder) => date && reminder.date.toDateString() === date.toDateString()
  );

  const handleAddReminder = () => {
    if (!date || !newReminder.title) return;
    
    const reminder = {
      id: Date.now().toString(),
      date: new Date(date),
      title: newReminder.title,
      description: newReminder.description,
    };
    
    setReminders([...reminders, reminder]);
    setNewReminder({ title: "", description: "" });
    setDialogOpen(false);
    
    toast({
      title: "Reminder added",
      description: `Added reminder for ${date.toLocaleDateString()}`,
    });
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter(reminder => reminder.id !== id));
    toast({
      title: "Reminder deleted",
      description: "Your reminder has been deleted.",
    });
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
              {selectedDateReminders.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Bell className="mx-auto h-10 w-10 opacity-20 mb-2" />
                  <p>No reminders for this date</p>
                  <p className="text-sm">Click 'Add Reminder' to create one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateReminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-start justify-between border rounded-md p-3">
                      <div>
                        <h4 className="font-medium">{reminder.title}</h4>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground">{reminder.description}</p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteReminder(reminder.id)}
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
