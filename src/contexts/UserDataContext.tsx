import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { userStorage } from '@/lib/userScopedStorage';
import { tasksAPI, notesAPI, scheduleAPI } from '@/lib/api';

// Types
type Task = {
    _id: string;
    title: string;
    dueDate: string;
    status: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
};

type Note = {
    _id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
};

type Reminder = {
    _id: string;
    title: string;
    description: string;
    date: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
};

type UserDataContextType = {
    // Data
    tasks: Task[];
    notes: Note[];
    reminders: Reminder[];

    // Loading states
    tasksLoading: boolean;
    notesLoading: boolean;
    remindersLoading: boolean;

    // Actions
    refreshTasks: () => Promise<void>;
    refreshNotes: () => Promise<void>;
    refreshReminders: () => Promise<void>;
    refreshAllData: () => Promise<void>;

    // User isolation
    clearUserData: () => void;
    getUserDataCount: () => { tasks: number; notes: number; reminders: number };
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, token } = useAuth();

    // State for user data - ALWAYS scoped to current user
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    // Loading states
    const [tasksLoading, setTasksLoading] = useState(false);
    const [notesLoading, setNotesLoading] = useState(false);
    const [remindersLoading, setRemindersLoading] = useState(false);

    // CRITICAL: Reset all data when user changes or logs out
    const clearUserData = useCallback(() => {
        console.log(`🧹 UserDataContext: Clearing all data for user change`);
        setTasks([]);
        setNotes([]);
        setReminders([]);
        setTasksLoading(false);
        setNotesLoading(false);
        setRemindersLoading(false);
    }, []);

    // Fetch tasks with user verification
    const refreshTasks = useCallback(async () => {
        if (!isAuthenticated || !user || !token) {
            console.log('⚠️ Cannot refresh tasks: User not authenticated');
            return;
        }

        console.log(`📋 Refreshing tasks for user: ${user.email} (${user.id})`);
        setTasksLoading(true);

        try {
            const fetchedTasks = await tasksAPI.getAllTasks();

            // Security verification: Ensure all tasks belong to current user
            const invalidTasks = fetchedTasks.filter((task: Task) => task.userId !== user.id);
            if (invalidTasks.length > 0) {
                console.error(`🚨 SECURITY BREACH: Received ${invalidTasks.length} tasks not belonging to user ${user.id}`);
                throw new Error('Data isolation breach in tasks');
            }

            setTasks(fetchedTasks);

            // Cache in user-scoped storage
            userStorage.setSession('tasks', fetchedTasks);

            console.log(`✅ Loaded ${fetchedTasks.length} tasks for user ${user.id}`);
        } catch (error) {
            console.error(`❌ Failed to refresh tasks for user ${user.id}:`, error);

            // Try to load from cache if API fails
            const cachedTasks = userStorage.getSession<Task[]>('tasks', []);
            if (cachedTasks && cachedTasks.length > 0) {
                console.log(`📦 Loaded ${cachedTasks.length} tasks from cache for user ${user.id}`);
                setTasks(cachedTasks);
            }
        } finally {
            setTasksLoading(false);
        }
    }, [isAuthenticated, user, token]);

    // Fetch notes with user verification
    const refreshNotes = useCallback(async () => {
        if (!isAuthenticated || !user || !token) {
            console.log('⚠️ Cannot refresh notes: User not authenticated');
            return;
        }

        console.log(`📝 Refreshing notes for user: ${user.email} (${user.id})`);
        setNotesLoading(true);

        try {
            const fetchedNotes = await notesAPI.getAllNotes();

            // Security verification: Ensure all notes belong to current user
            const invalidNotes = fetchedNotes.filter((note: Note) => note.userId !== user.id);
            if (invalidNotes.length > 0) {
                console.error(`🚨 SECURITY BREACH: Received ${invalidNotes.length} notes not belonging to user ${user.id}`);
                throw new Error('Data isolation breach in notes');
            }

            setNotes(fetchedNotes);

            // Cache in user-scoped storage
            userStorage.setSession('notes', fetchedNotes);

            console.log(`✅ Loaded ${fetchedNotes.length} notes for user ${user.id}`);
        } catch (error) {
            console.error(`❌ Failed to refresh notes for user ${user.id}:`, error);

            // Try to load from cache if API fails
            const cachedNotes = userStorage.getSession<Note[]>('notes', []);
            if (cachedNotes && cachedNotes.length > 0) {
                console.log(`📦 Loaded ${cachedNotes.length} notes from cache for user ${user.id}`);
                setNotes(cachedNotes);
            }
        } finally {
            setNotesLoading(false);
        }
    }, [isAuthenticated, user, token]);

    // Fetch reminders with user verification
    const refreshReminders = useCallback(async () => {
        if (!isAuthenticated || !user || !token) {
            console.log('⚠️ Cannot refresh reminders: User not authenticated');
            return;
        }

        console.log(`📅 Refreshing reminders for user: ${user.email} (${user.id})`);
        setRemindersLoading(true);

        try {
            const fetchedReminders = await scheduleAPI.getAllReminders();

            // Security verification: Ensure all reminders belong to current user
            const invalidReminders = fetchedReminders.filter((reminder: Reminder) => reminder.userId !== user.id);
            if (invalidReminders.length > 0) {
                console.error(`🚨 SECURITY BREACH: Received ${invalidReminders.length} reminders not belonging to user ${user.id}`);
                throw new Error('Data isolation breach in reminders');
            }

            setReminders(fetchedReminders);

            // Cache in user-scoped storage
            userStorage.setSession('reminders', fetchedReminders);

            console.log(`✅ Loaded ${fetchedReminders.length} reminders for user ${user.id}`);
        } catch (error) {
            console.error(`❌ Failed to refresh reminders for user ${user.id}:`, error);

            // Try to load from cache if API fails
            const cachedReminders = userStorage.getSession<Reminder[]>('reminders', []);
            if (cachedReminders && cachedReminders.length > 0) {
                console.log(`📦 Loaded ${cachedReminders.length} reminders from cache for user ${user.id}`);
                setReminders(cachedReminders);
            }
        } finally {
            setRemindersLoading(false);
        }
    }, [isAuthenticated, user, token]);

    // Refresh all data
    const refreshAllData = useCallback(async () => {
        if (!isAuthenticated || !user) {
            return;
        }

        await Promise.all([refreshTasks(), refreshNotes(), refreshReminders()]);
    }, [isAuthenticated, user, refreshTasks, refreshNotes, refreshReminders]);

    // Get data counts for debugging
    const getUserDataCount = useCallback(() => {
        return {
            tasks: tasks.length,
            notes: notes.length,
            reminders: reminders.length
        };
    }, [tasks.length, notes.length, reminders.length]);

    // Effect: Clear data when user changes or logs out
    useEffect(() => {
        if (!isAuthenticated || !user) {
            clearUserData();
            return;
        }

        // If user changed, clear old data and refresh new data
        clearUserData(); // Clear old data first
        refreshAllData(); // Then load new user's data
    }, [isAuthenticated, user?.id]); // React to user ID changes

    const value: UserDataContextType = {
        // Data
        tasks,
        notes,
        reminders,

        // Loading states
        tasksLoading,
        notesLoading,
        remindersLoading,

        // Actions
        refreshTasks,
        refreshNotes,
        refreshReminders,
        refreshAllData,

        // User isolation
        clearUserData,
        getUserDataCount
    };

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
};

export const useUserData = (): UserDataContextType => {
    const context = useContext(UserDataContext);
    if (context === undefined) {
        throw new Error('useUserData must be used within a UserDataProvider');
    }
    return context;
};

export default UserDataContext;
