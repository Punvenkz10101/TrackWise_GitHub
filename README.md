# 🚀 TrackWise - Personal Productivity & AI Assistant Platform

[![TrackWise Demo](https://img.shields.io/badge/📹-Watch%20Demo-blue?style=for-the-badge)](https://drive.google.com/file/d/1huE3-d2j-OozbaxTdzNJ5GhC5zdt9LtM/view?usp=drive_link)

![TrackWise Logo](public/favicon.svg)

> **TrackWise** is a comprehensive personal productivity platform that combines task management, note-taking, scheduling, progress tracking, collaborative features, and an AI-powered chatbot assistant. Built with modern web technologies, it provides a seamless experience for managing your daily tasks, collaborating with others, and getting intelligent assistance.

## ✨ Features

### 🎯 Core Productivity Features
| Feature | Description |
|---------|-------------|
| 📋 **Task Management** | Create, edit, delete tasks with priorities, due dates, and progress tracking |
| 📝 **Rich Notes** | Advanced text editor with formatting, organization, and search capabilities |
| 📅 **Schedule & Reminders** | Calendar integration with event management and notifications |
| 📊 **Progress Analytics** | Visual charts and insights for goal tracking and habit monitoring |
| 🤖 **AI Assistant** | Hybrid AI system combining local logic with Google Gemini API |

### 🔐 Authentication & Security
| Feature | Description |
|---------|-------------|
| 🔐 **Multi-Browser Authentication** | Tab-scoped user sessions allowing multiple users on same device |
| 🛡️ **JWT Security** | Secure token-based authentication with password hashing |
| 🚪 **Protected Routes** | Role-based access control and session management |
| 🔄 **Session Persistence** | Automatic session restoration across browser refreshes |

### 👥 Collaborative Features
| Feature | Description |
|---------|-------------|
| 🏠 **Study Rooms** | Create and join collaborative study/work sessions |
| 🎨 **Real-time Whiteboard** | Collaborative drawing with multiple users |
| ⏱️ **Pomodoro Timer** | Shared focus timer with break management |
| 📝 **Shared Task Lists** | Collaborative task management within rooms |
| 💬 **Real-time Chat** | Live messaging within study rooms |
| 👥 **User Presence** | See who's currently in the room |

### 🎨 User Interface
| Feature | Description |
|---------|-------------|
| 🎨 **Modern UI** | Responsive design with dark/light themes |
| ♿ **Accessible Components** | WCAG compliant UI components |
| 📱 **Mobile Responsive** | Optimized for all device sizes |
| 🎪 **Interactive Elements** | Smooth animations and transitions |

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss)
![Radix UI](https://img.shields.io/badge/Radix%20UI-Latest-161618?style=flat)
![React Quill](https://img.shields.io/badge/React%20Quill-Editor-000000?style=flat)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-5.1-000000?style=flat&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=flat&logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-010101?style=flat&logo=socket.io)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat&logo=jsonwebtokens)

### AI & Tools
![Google Gemini](https://img.shields.io/badge/Gemini%20AI-API-4285F4?style=flat&logo=google)
![bcrypt](https://img.shields.io/badge/bcrypt-Hashing-000000?style=flat)
![ESLint](https://img.shields.io/badge/ESLint-9.9-4B32C3?style=flat&logo=eslint)

## 🚀 Quick Start

### Prerequisites
- ⚡ Node.js (v18+)
- 📦 npm or yarn
- 🗄️ MongoDB Atlas account
- 🔑 Google Gemini API key (for AI features)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd TrackWise_GitHub

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your credentials

# 4. Start development servers
npm run dev:full
```

### Environment Variables
Create `server/.env`:
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development
```

### Access the App
- 🌐 **Frontend**: http://localhost:8081
- 🔌 **Backend API**: http://localhost:5000

## 📁 Project Structure

```
TrackWise_GitHub/
├── 📱 src/                    # Frontend (React + TypeScript)
│   ├── 🧩 components/         # UI Components
│   │   ├── ui/               # Base UI components
│   │   ├── layout/           # Layout components
│   │   └── Whiteboard.tsx    # Collaborative whiteboard
│   ├── 🔄 contexts/          # React Contexts
│   │   ├── AuthContext.tsx   # Authentication state
│   │   ├── UserDataContext.tsx # User data management
│   │   └── ThemeContext.tsx  # Theme management
│   ├── 🎣 hooks/             # Custom Hooks
│   ├── 📄 pages/             # Page Components
│   │   └── dashboard/        # Dashboard pages
│   └── 🛠️ lib/               # Utilities
│       ├── api.ts            # API client
│       ├── multiBrowserAuth.ts # Multi-browser auth
│       ├── tabScopedStorage.ts # Tab-scoped storage
│       └── socketService.ts  # Socket.IO client
├── 🖥️ server/                # Backend (Node.js + Express)
│   ├── 🔐 middleware/        # Auth Middleware
│   ├── 📊 models/           # MongoDB Models
│   ├── 🛣️ routes/           # API Routes
│   ├── 🧠 utils/            # Utilities
│   └── socket/              # Socket.IO handlers
└── 📦 package.json           # Dependencies
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | User registration |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | User logout |

### Core Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST/PUT/DELETE` | `/api/tasks` | Task management |
| `GET/POST/PUT/DELETE` | `/api/notes` | Note management |
| `GET/POST/PUT/DELETE` | `/api/schedule` | Schedule management |
| `GET/POST/PUT/DELETE` | `/api/progress` | Progress tracking |
| `POST` | `/api/chatbot` | AI assistant |

### Collaborative Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rooms/create` | Create study room |
| `POST` | `/api/rooms/join` | Join study room |
| `GET` | `/api/rooms/:id` | Get room details |
| `DELETE` | `/api/rooms/:id` | Delete room |

## 🎨 Collaborative Whiteboard

The real-time collaborative whiteboard features:

### 🖌️ Drawing Tools
- **Draw Mode**: Freehand drawing with customizable colors and brush sizes
- **Erase Mode**: Separate eraser tool with adjustable size
- **Color Palette**: 8 predefined colors for quick selection
- **Brush Size**: Adjustable from 1-15 pixels

### 👥 Real-time Collaboration
- **Multi-user Drawing**: See other users' drawings in real-time
- **User Presence**: Visual indicators for active users
- **Canvas Synchronization**: Automatic canvas state sharing
- **Touch Support**: Full touch device compatibility

### 🎯 Features
- **High DPI Support**: Crisp rendering on all screen densities
- **Performance Optimized**: 60fps drawing with throttled emissions
- **Responsive Design**: Adapts to any screen size
- **Cross-platform**: Works on desktop, tablet, and mobile

## 🏠 Study Rooms

Collaborative study rooms provide a complete virtual workspace:

### ⏱️ Pomodoro Timer
- **Focus Sessions**: 25-minute work periods
- **Break Timer**: 5-minute short breaks
- **Long Breaks**: 15-minute breaks after 4 sessions
- **Synchronized**: All room members share the same timer

### 📝 Shared Task Management
- **Real-time Tasks**: Add, edit, delete tasks visible to all members
- **Task Status**: Mark tasks as complete/incomplete
- **Collaborative Lists**: Shared task lists for group projects

### 💬 Live Chat
- **Real-time Messaging**: Instant communication within rooms
- **User Identification**: Messages show sender information
- **Persistent History**: Chat history maintained during session

### 👥 User Management
- **Room Creation**: Generate unique room codes
- **Join Rooms**: Enter rooms with room codes
- **User Presence**: See who's currently in the room
- **Member List**: View all active room members

## 🔐 Multi-Browser Authentication

Advanced authentication system supporting multiple users on the same device:

### 🆔 Tab-Scoped Sessions
- **Isolated Sessions**: Each browser tab maintains separate user sessions
- **Unique Tab IDs**: Automatic tab identification and management
- **Session Persistence**: Sessions survive page refreshes
- **Cross-tab Isolation**: Users can't access each other's data

### 🔄 Session Management
- **Automatic Restoration**: Sessions restored on page reload
- **Token Validation**: JWT token validation and refresh
- **Secure Storage**: Tab-scoped storage with encryption
- **Session Cleanup**: Automatic cleanup of expired sessions

### 👥 Multi-User Support
- **Concurrent Users**: Multiple users can use the same device simultaneously
- **User Switching**: Easy switching between users in different tabs
- **Data Isolation**: Complete separation of user data between tabs
- **Session Monitoring**: View all active sessions across tabs

## 🤖 AI Assistant Features

The TrackWise AI assistant provides intelligent help across multiple domains:

### 🎯 Personal Data Assistance
- **Task Management**: Organize tasks, set priorities, create task lists
- **Note Organization**: Categorize notes and optimize search
- **Schedule Optimization**: Get scheduling advice and time management tips
- **Progress Analysis**: Insights about productivity patterns and goal progress

### 📚 General Knowledge
- **Productivity Tips**: Time management, goal setting, efficiency techniques
- **Study Methods**: Learning strategies and academic productivity
- **Work-Life Balance**: Healthy work-life boundary guidance
- **Habit Formation**: Building and maintaining positive habits

### 🧮 Mathematical Assistance
- **Calculations**: Complex mathematical operations and formulas
- **Unit Conversions**: Convert between different units and measurements
- **Problem Solving**: Step-by-step solutions to mathematical problems

## 🎨 UI Components

TrackWise uses a comprehensive set of modern UI components:

- 🧭 **Navigation**: Sidebar, breadcrumbs, navigation menus
- 📝 **Forms**: Input fields, select dropdowns, checkboxes, radio buttons
- 📊 **Data Display**: Tables, cards, badges, avatars
- 💬 **Feedback**: Toasts, alerts, progress bars, skeletons
- 🎪 **Layout**: Modals, drawers, sheets, accordions
- 🎮 **Interactive**: Buttons, switches, sliders, tooltips
- 📝 **Rich Text Editor**: React Quill integration with formatting tools

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend
```bash
cd server
npm install --production
# Deploy to Node.js hosting service
```

### Production Environment
```env
NODE_ENV=production
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
GEMINI_API_KEY=your_production_gemini_key
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| 🔌 Port 5000 in use | `netstat -ano \| findstr :5000` then `taskkill /PID <id> /F` |
| 🗄️ MongoDB connection | Verify connection string and IP whitelist |
| 🔑 AI not working | Check Gemini API key and quota |
| 💻 PowerShell issues | Use `;` instead of `&&` for command chaining |
| 🎨 Whiteboard not working | Check Socket.IO connection and room permissions |
| 🔐 Auth issues | Clear browser storage and restart application |

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

## 📝 Recent Updates

### v2.0.0 - Collaborative Features
- ✨ Added real-time collaborative whiteboard
- 🏠 Implemented study rooms with Pomodoro timer
- 👥 Added multi-user support with tab-scoped authentication
- 💬 Integrated real-time chat in study rooms
- 📝 Added shared task management in rooms

### v1.5.0 - Enhanced UI & Performance
- 🎨 Improved responsive design and accessibility
- ⚡ Optimized performance and loading times
- 🔧 Enhanced error handling and user feedback
- 🧹 Cleaned up codebase and removed test files

### v1.0.0 - Core Features
- 📋 Task management system
- 📝 Rich text notes with React Quill
- 📅 Schedule and calendar integration
- 🤖 AI assistant with Google Gemini
- 🔐 JWT authentication system

<div align="center">

**TrackWise** - Empowering your productivity with intelligent assistance and collaboration! 🚀

[![GitHub stars](https://img.shields.io/github/stars/yourusername/TrackWise_GitHub?style=social)](https://github.com/yourusername/TrackWise_GitHub)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/TrackWise_GitHub?style=social)](https://github.com/yourusername/TrackWise_GitHub)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/TrackWise_GitHub)](https://github.com/yourusername/TrackWise_GitHub/issues)

</div>
