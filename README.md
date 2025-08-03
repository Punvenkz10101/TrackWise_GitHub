# TrackWise - Personal Productivity & AI Assistant Platform

![TrackWise Logo](public/favicon.svg)

TrackWise is a comprehensive personal productivity platform that combines task management, note-taking, scheduling, progress tracking, and an AI-powered chatbot assistant. Built with modern web technologies, it provides a seamless experience for managing your daily tasks and getting intelligent assistance.

## 🚀 Features

### 📋 Task Management
- **Create, edit, and delete tasks** with due dates and priorities
- **Task categorization** and status tracking
- **Priority levels** and deadline management
- **Task completion tracking** with progress visualization
- **Responsive task interface** with drag-and-drop functionality

### 📝 Notes System
- **Rich text editor** with formatting options using React Quill
- **Note organization** and categorization
- **Search functionality** across all notes
- **Real-time editing** with auto-save
- **Note sharing** and collaboration features

### 📅 Schedule & Reminders
- **Calendar integration** for event management
- **Reminder system** with notifications
- **Schedule visualization** with daily, weekly, and monthly views
- **Event categorization** and priority settings

### 📊 Progress Tracking
- **Goal setting** and milestone tracking
- **Progress visualization** with charts and graphs using Recharts
- **Performance analytics** and insights
- **Habit tracking** and streak monitoring
- **Data export** and reporting capabilities

### 🤖 AI Chatbot Assistant
- **Hybrid AI system** combining local logic with Google Gemini API
- **Context-aware responses** based on your personal data
- **Task assistance** - ask for help with task management
- **Note assistance** - get help with note organization
- **Schedule help** - receive scheduling suggestions
- **Progress insights** - get analytics and recommendations
- **General knowledge** - ask questions about productivity, time management, etc.

### 🔐 Authentication & Security
- **JWT-based authentication** with secure token management
- **User registration** and login system
- **Password hashing** with bcrypt
- **Protected routes** and session management
- **Development mode** with automatic authentication for testing

### 🎨 Modern UI/UX
- **Responsive design** that works on desktop, tablet, and mobile
- **Dark/Light theme** support with theme switching
- **Modern UI components** built with Radix UI and Tailwind CSS
- **Smooth animations** and transitions
- **Accessible design** following WCAG guidelines

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for client-side routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Lucide React** for icons
- **React Quill** for rich text editing
- **Recharts** for data visualization
- **Sonner** for toast notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests
- **Google Gemini AI** integration
- **Axios** for HTTP requests

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Nodemon** for server auto-reload
- **Concurrently** for running multiple processes

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TrackWise_GitHub
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the server directory:
```env
# MongoDB Configuration
MONGO_URI=your_mongodb_atlas_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081
```

### 4. Start the Development Servers

#### Option 1: Run Both Servers Together
```bash
npm run dev:full
```

#### Option 2: Run Servers Separately
```bash
# Terminal 1 - Start backend server
cd server
npm run dev

# Terminal 2 - Start frontend server
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:8081 (or the port shown in terminal)
- **Backend API**: http://localhost:5000

## 🚀 Available Scripts

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Scripts
```bash
cd server
npm run dev          # Start server with nodemon
npm start            # Start server with node
```

### Full Stack Scripts
```bash
npm run dev:full     # Start both frontend and backend
npm run server       # Start only the backend server
```

## 📁 Project Structure

```
TrackWise_GitHub/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Radix UI components
│   │   ├── layout/        # Layout components
│   │   └── CustomQuill.tsx # Rich text editor
│   ├── contexts/          # React contexts (Auth, Theme)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── Landing.tsx    # Landing page
│   │   └── NotFound.tsx   # 404 page
│   └── App.tsx           # Main app component
├── server/                # Backend source code
│   ├── middleware/        # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── index.js          # Server entry point
├── public/               # Static assets
└── package.json          # Frontend dependencies
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Notes
- `GET /api/notes` - Get user notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Schedule
- `GET /api/schedule` - Get user schedule
- `POST /api/schedule` - Create new event
- `PUT /api/schedule/:id` - Update event
- `DELETE /api/schedule/:id` - Delete event

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress` - Create progress entry
- `PUT /api/progress/:id` - Update progress
- `DELETE /api/progress/:id` - Delete progress entry

### Chatbot
- `POST /api/chatbot` - Send message to AI assistant

## 🤖 AI Chatbot Features

The TrackWise AI assistant provides intelligent help across multiple domains:

### Personal Data Assistance
- **Task Management**: Ask for help organizing tasks, setting priorities, or creating task lists
- **Note Organization**: Get suggestions for note categorization and search optimization
- **Schedule Optimization**: Receive scheduling advice and time management tips
- **Progress Analysis**: Get insights about your productivity patterns and goal progress

### General Knowledge
- **Productivity Tips**: Learn about time management, goal setting, and efficiency techniques
- **Study Methods**: Get advice on learning strategies and academic productivity
- **Work-Life Balance**: Receive guidance on maintaining healthy work-life boundaries
- **Habit Formation**: Learn about building and maintaining positive habits

### Technical Support
- **Feature Explanations**: Understand how to use different TrackWise features
- **Best Practices**: Get recommendations for optimal platform usage
- **Troubleshooting**: Receive help with common issues and questions

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcrypt with salt rounds
- **CORS Protection** with configurable allowed origins
- **Input Validation** with Zod schema validation
- **Error Handling** with proper error messages
- **Rate Limiting** (can be implemented for production)

## 🎨 UI Components

TrackWise uses a comprehensive set of UI components built with Radix UI and Tailwind CSS:

- **Navigation**: Sidebar, breadcrumbs, navigation menus
- **Forms**: Input fields, select dropdowns, checkboxes, radio buttons
- **Data Display**: Tables, cards, badges, avatars
- **Feedback**: Toasts, alerts, progress bars, skeletons
- **Layout**: Modals, drawers, sheets, accordions
- **Interactive**: Buttons, switches, sliders, tooltips

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd server
npm install --production
# Deploy to your Node.js hosting service (Heroku, Vercel, etc.)
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
GEMINI_API_KEY=your_production_gemini_key
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port 5000 Already in Use**
   ```bash
   # Find the process using port 5000
   netstat -ano | findstr :5000
   # Kill the process
   taskkill /PID <process_id> /F
   ```

2. **MongoDB Connection Issues**
   - Verify your MongoDB Atlas connection string
   - Check network connectivity
   - Ensure IP whitelist includes your IP address

3. **Frontend Build Issues**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **AI Chatbot Not Working**
   - Verify your Gemini API key is correct
   - Check API quota and billing status
   - Ensure the API key has proper permissions

5. **PowerShell Command Issues**
   - Use `;` instead of `&&` for command chaining in PowerShell
   - Or run commands separately

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the authentication guide in `AUTH_README.md`
- Review the server logs for debugging information

## 🔧 Development Notes

### Authentication System
- Uses JWT tokens for secure authentication
- Includes development mode for easier testing
- Password hashing with bcrypt for security
- Protected routes with automatic redirects

### AI Integration
- Hybrid approach combining local logic with Gemini API
- Context-aware responses based on user data
- Fallback to general knowledge when personal data isn't relevant
- Secure API key management

### Database Models
- User management with secure authentication
- Task management with priorities and due dates
- Notes with rich text content
- Progress tracking with analytics
- Schedule/reminder system
- Chat message history

---

**TrackWise** - Empowering your productivity with intelligent assistance! 🚀
