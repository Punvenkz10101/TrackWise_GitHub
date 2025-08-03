# 🚀 TrackWise - Personal Productivity & AI Assistant Platform

[![TrackWise Demo](https://img.shields.io/badge/📹-Watch%20Demo-blue?style=for-the-badge)](https://drive.google.com/file/d/1huE3-d2j-OozbaxTdzNJ5GhC5zdt9LtM/view?usp=drive_link)

![TrackWise Logo](public/favicon.svg)

> **TrackWise** is a comprehensive personal productivity platform that combines task management, note-taking, scheduling, progress tracking, and an AI-powered chatbot assistant. Built with modern web technologies, it provides a seamless experience for managing your daily tasks and getting intelligent assistance.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📋 **Task Management** | Create, edit, delete tasks with priorities, due dates, and progress tracking |
| 📝 **Rich Notes** | Advanced text editor with formatting, organization, and search capabilities |
| 📅 **Schedule & Reminders** | Calendar integration with event management and notifications |
| 📊 **Progress Analytics** | Visual charts and insights for goal tracking and habit monitoring |
| 🤖 **AI Assistant** | Hybrid AI system combining local logic with Google Gemini API |
| 🔐 **Secure Auth** | JWT-based authentication with password hashing and protected routes |
| 🎨 **Modern UI** | Responsive design with dark/light themes and accessible components |

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss)
![Radix UI](https://img.shields.io/badge/Radix%20UI-Latest-161618?style=flat)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-5.1-000000?style=flat&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=flat&logo=mongodb)
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
│   ├── 🔄 contexts/          # React Contexts
│   ├── 🎣 hooks/             # Custom Hooks
│   ├── 📄 pages/             # Page Components
│   └── 🛠️ lib/               # Utilities
├── 🖥️ server/                # Backend (Node.js + Express)
│   ├── 🔐 middleware/        # Auth Middleware
│   ├── 📊 models/           # MongoDB Models
│   ├── 🛣️ routes/           # API Routes
│   └── 🧠 utils/            # Utilities
└── 📦 package.json           # Dependencies
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | User registration |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/auth/me` | Get current user |
| `GET/POST/PUT/DELETE` | `/api/tasks` | Task management |
| `GET/POST/PUT/DELETE` | `/api/notes` | Note management |
| `GET/POST/PUT/DELETE` | `/api/schedule` | Schedule management |
| `GET/POST/PUT/DELETE` | `/api/progress` | Progress tracking |
| `POST` | `/api/chatbot` | AI assistant |

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

## 🎨 UI Components

TrackWise uses a comprehensive set of modern UI components:

- 🧭 **Navigation**: Sidebar, breadcrumbs, navigation menus
- 📝 **Forms**: Input fields, select dropdowns, checkboxes, radio buttons
- 📊 **Data Display**: Tables, cards, badges, avatars
- 💬 **Feedback**: Toasts, alerts, progress bars, skeletons
- 🎪 **Layout**: Modals, drawers, sheets, accordions
- 🎮 **Interactive**: Buttons, switches, sliders, tooltips

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

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

## 📞 Support

- 🐛 **Issues**: Create an issue in the GitHub repository
- 📖 **Docs**: Check `AUTH_README.md` for authentication details
- 🔍 **Debug**: Review server logs for troubleshooting

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">

**TrackWise** - Empowering your productivity with intelligent assistance! 🚀

[![GitHub stars](https://img.shields.io/github/stars/yourusername/TrackWise_GitHub?style=social)](https://github.com/yourusername/TrackWise_GitHub)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/TrackWise_GitHub?style=social)](https://github.com/yourusername/TrackWise_GitHub)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/TrackWise_GitHub)](https://github.com/yourusername/TrackWise_GitHub/issues)

</div>
