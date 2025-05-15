import { getToken } from './auth';

// Define the API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const isDev = import.meta.env.DEV;

// Log the API URL being used at startup (helps with debugging)
if (isDev) {
  console.log('API URL:', API_URL);
}

/**
 * Base fetch function with authentication
 */
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  // Check if token exists when making requests to protected endpoints
  if (!token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
    if (isDev) {
      console.error('No authentication token found. You may need to log in again.');
    }
    throw new Error('Authentication required');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = {};
      let errorMessage = 'API request failed';
      
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
      } catch (e) {
        // If JSON parsing fails, try to get text
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch (textError) {
          // Ignore text parsing errors
        }
      }
      
      // Log additional debug info in development
      if (isDev) {
        console.error(`API Error (${response.status}):`, {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestBody: options.body ? JSON.parse(options.body.toString()) : null
        });
      }
      
      // Special handling for different error types
      if (response.status === 401) {
        throw new Error(`Authentication failed: ${errorMessage}`);
      } else if (response.status === 400) {
        throw new Error(`Bad request: ${errorMessage}`);
      } else if (response.status === 404) {
        throw new Error(`Not found: ${errorMessage}`);
      } else if (response.status === 500) {
        throw new Error(`Server error: ${errorMessage}`);
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    // Handle different types of fetch errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error(`Connection error to ${API_URL}${endpoint}. The server may be down or unreachable.`);
      throw new Error(`Could not connect to server. Please check your network connection and make sure the server is running.`);
    }
    
    if (error.name === 'AbortError') {
      console.error(`Request to ${API_URL}${endpoint} timed out after 10 seconds.`);
      throw new Error(`Request timed out. The server may be overloaded or unreachable.`);
    }
    
    // Rethrow the error, but add more context in development
    if (isDev && error instanceof Error) {
      console.error(`API call to ${endpoint} failed:`, error.message);
      console.error('Request details:', { 
        method: options.method || 'GET',
        endpoint,
        body: options.body ? JSON.parse(options.body.toString()) : undefined
      });
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name: string, email: string, password: string) =>
    fetchWithAuth('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getCurrentUser: () => fetchWithAuth('/auth/me'),
};

// Tasks API
export const tasksAPI = {
  getAllTasks: () => fetchWithAuth('/tasks'),

  getTask: (id: string) => fetchWithAuth(`/tasks/${id}`),

  createTask: (taskData: { title: string; dueDate: Date; status: string }) =>
    fetchWithAuth('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),

  updateTask: (id: string, taskData: { title?: string; dueDate?: Date; status?: string }) =>
    fetchWithAuth(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }),

  deleteTask: (id: string) =>
    fetchWithAuth(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};

// Notes API
export const notesAPI = {
  getAllNotes: () => fetchWithAuth('/notes'),

  getNote: (id: string) => fetchWithAuth(`/notes/${id}`),

  createNote: (noteData: { title: string; content?: string }) =>
    fetchWithAuth('/notes', {
      method: 'POST',
      body: JSON.stringify({
        ...noteData,
        content: noteData.content || '' // Ensure content is always provided with at least an empty string
      }),
    }),

  updateNote: (id: string, noteData: { title?: string; content?: string }) =>
    fetchWithAuth(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    }),

  deleteNote: (id: string) =>
    fetchWithAuth(`/notes/${id}`, {
      method: 'DELETE',
    }),
};

// Schedule/Reminders API
export const scheduleAPI = {
  getAllReminders: () => fetchWithAuth('/schedule'),

  getReminder: (id: string) => fetchWithAuth(`/schedule/${id}`),

  createReminder: (reminderData: { title: string; description?: string; date: Date }) =>
    fetchWithAuth('/schedule', {
      method: 'POST',
      body: JSON.stringify(reminderData),
    }),

  updateReminder: (id: string, reminderData: { title?: string; description?: string; date?: Date }) =>
    fetchWithAuth(`/schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reminderData),
    }),

  deleteReminder: (id: string) =>
    fetchWithAuth(`/schedule/${id}`, {
      method: 'DELETE',
    }),
};

// Progress API
export const progressAPI = {
  getAllProgress: () => fetchWithAuth('/progress'),

  saveProgress: (progressData: { 
    date: Date; 
    completedTasks?: number; 
    studyHours?: number;
    subjects?: Array<{ name: string; value: number }>;
  }) =>
    fetchWithAuth('/progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    }),

  getSummary: (days?: number) => 
    fetchWithAuth(`/progress/summary${days ? `?days=${days}` : ''}`),

  getDailyData: (days?: number) => 
    fetchWithAuth(`/progress/daily${days ? `?days=${days}` : ''}`),
}; 