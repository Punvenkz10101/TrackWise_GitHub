# TrackWise Authentication System

This document explains how the authentication system in TrackWise works and how to use it.

## Overview

TrackWise uses JWT (JSON Web Tokens) based authentication with MongoDB for user management. The system includes:

- User registration (signup)
- User login
- Protected routes
- Token-based authentication
- Development mode with automatic authentication

## MongoDB Integration

The application connects to a MongoDB Atlas database. User data is stored in the `users` collection with password hashing for security.

## Authentication Flow

1. **User Registration (Signup)**:
   - User provides name, email, and password
   - System checks if email is already registered
   - If not, password is hashed and user is stored in MongoDB
   - JWT token is generated and returned to the client
   - User is automatically logged in after registration

2. **User Login**:
   - User provides email and password
   - System validates credentials against MongoDB
   - JWT token is generated and returned to the client
   - Frontend stores the token for future authenticated requests

3. **Protected Routes**:
   - Requests to protected endpoints include JWT token in the Authorization header
   - Server middleware verifies the token
   - If valid, user information is attached to the request
   - If invalid, request is rejected with 401 Unauthorized

## Using Authentication in Frontend

### Login

```jsx
import { useAuth } from "@/contexts/AuthContext";

const { loginWithCredentials } = useAuth();

// In your submit handler
try {
  await loginWithCredentials(email, password);
  // Redirect or show success message
} catch (error) {
  // Handle error
}
```

### Signup

```jsx
import { useAuth } from "@/contexts/AuthContext";

const { signupWithCredentials } = useAuth();

// In your submit handler
try {
  await signupWithCredentials(name, email, password);
  // Redirect or show success message
} catch (error) {
  // Handle error
}
```

### Access User Information

```jsx
import { useAuth } from "@/contexts/AuthContext";

const { user, isAuthenticated } = useAuth();

if (isAuthenticated) {
  console.log(user.name); // Access user's name
  console.log(user.email); // Access user's email
}
```

### Logout

```jsx
import { useAuth } from "@/contexts/AuthContext";

const { logout } = useAuth();

// To log out
logout();
```

## Development vs Production Mode

In development mode (`isDev === true`), the system will automatically generate a development token and authenticate users without requiring actual credentials. This simplifies development and testing.

In production mode, full JWT authentication with MongoDB is enforced.

## Security Considerations

1. Passwords are hashed using bcrypt before storing in MongoDB
2. JWT tokens expire after 30 days (configurable)
3. Sensitive endpoints are protected by the auth middleware
4. MongoDB connection uses encrypted credentials

## Testing Authentication

You can test the MongoDB connection and authentication using:

```bash
node server/testConnection.js
```

This script will:
- Connect to MongoDB
- List all collections
- Show existing users
- Create a test user
- Verify password validation
- Delete the test user

## Troubleshooting

1. **Login fails with "Invalid credentials"**:
   - Verify email and password are correct
   - Check if user exists in MongoDB

2. **Token expiration issues**:
   - User will be automatically logged out when token expires
   - Adjust expiration time in `generateToken` function

3. **MongoDB connection issues**:
   - Check MongoDB Atlas connection string
   - Verify network connectivity
   - Make sure MongoDB Atlas IP whitelist includes your server 