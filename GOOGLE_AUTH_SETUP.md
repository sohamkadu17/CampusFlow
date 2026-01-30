# Google OAuth Setup Guide for CampusFlow

## Overview
This guide explains how to enable Google OAuth authentication in CampusFlow using Supabase.

## Features Implemented
✅ Google Sign-In button with official Google branding
✅ Role-based authentication (Student/Organizer/Admin)
✅ Automatic user synchronization with backend
✅ OAuth callback handler with loading states
✅ Session persistence with JWT tokens
✅ Separate signup flows for different roles

## Architecture

### Frontend Components
1. **AuthScreen.tsx**
   - Role selection UI
   - Email/password authentication
   - Google Sign-In button
   - Role-specific signup fields

2. **AuthCallback.tsx**
   - Handles OAuth redirect from Google
   - Syncs user with backend API
   - Stores JWT tokens
   - Redirects to appropriate dashboard

3. **supabase.ts**
   - Supabase client initialization
   - `signInWithGoogle()` method
   - Session management

### Backend Integration
- OAuth users are automatically registered/logged in
- Google user ID is used as password hash
- User metadata synced with MongoDB

## Setup Instructions

### 1. Configure Google OAuth in Supabase

1. Go to your Supabase project dashboard: https://cklblrotmhchvgeyllyg.supabase.co

2. Navigate to **Authentication > Providers**

3. Enable **Google** provider

4. Configure OAuth credentials:
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: 
     - `https://cklblrotmhchvgeyllyg.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback`

5. Get Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Add authorized redirect URIs (from Supabase)
   - Copy **Client ID** and **Client Secret**

6. Paste credentials in Supabase Google provider settings

7. Click **Save**

### 2. Test the OAuth Flow

1. Start the backend server:
   ```bash
   cd Backend
   pnpm run dev
   ```

2. Start the frontend server:
   ```bash
   cd Frontend
   pnpm run dev
   ```

3. Navigate to `http://localhost:5173`

4. Click **Get Started** → **Sign In**

5. Select a role (Student/Organizer/Admin)

6. Click **Continue with Google**

7. Complete Google sign-in

8. You'll be redirected to `/auth/callback` and then to your dashboard

## User Flow

### Sign Up with Google
```
1. User selects role (Student/Organizer/Admin)
2. (Optional) User fills in signup fields:
   - Name
   - Department (dropdown)
   - Year (for students)
   - Club Name (for organizers)
3. User clicks "Sign up with Google"
4. Role and signup data stored in localStorage
5. Redirect to Google OAuth
6. User authenticates with Google
7. Redirect back to /auth/callback
8. Callback handler:
   - Retrieves Google user session
   - Retrieves stored role and signup data
   - Attempts backend login (checks if user exists)
   - If user doesn't exist, registers new user
   - Stores JWT tokens
   - Cleans up localStorage
9. Redirect to appropriate dashboard
```

### Sign In with Google
```
1. User selects role
2. User clicks "Sign in with Google"
3. Role stored in localStorage
4. Redirect to Google OAuth
5. User authenticates with Google
6. Redirect back to /auth/callback
7. Callback handler:
   - Retrieves Google user session
   - Retrieves stored role
   - Backend login with existing user
   - Stores JWT tokens
9. Redirect to dashboard
```

## Code Changes

### 1. Frontend/src/lib/supabase.ts
Added `signInWithGoogle()` method:
```typescript
signInWithGoogle: async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });
  if (error) throw error;
  return data;
}
```

### 2. Frontend/src/app/components/AuthScreen.tsx
Added:
- Google Sign-In button with official branding
- `handleGoogleSignIn()` function
- Signup data persistence in localStorage
- "Or continue with" divider

### 3. Frontend/src/app/components/AuthCallback.tsx (NEW)
Complete OAuth callback handler with:
- Session retrieval from Supabase
- Role and signup data from localStorage
- Backend login/register logic
- JWT token storage
- Loading/success/error states
- Auto-redirect to dashboard

### 4. Frontend/src/app/App.tsx
Updated to use React Router:
- Added `react-router-dom` routing
- Created `/auth/callback` route
- Protected dashboard routes
- Navigation helpers

## Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://cklblrotmhchvgeyllyg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://soham_db_user:QSmILqCVk5tFj7aI@campusflow.ute8yc2.mongodb.net/campusflow
JWT_SECRET=your-jwt-secret
SUPABASE_URL=https://cklblrotmhchvgeyllyg.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

## Security Considerations

1. **OAuth State Parameter**: Supabase automatically handles CSRF protection
2. **JWT Tokens**: Stored in localStorage (consider httpOnly cookies for production)
3. **Password for OAuth Users**: Google ID used as password (never exposed to user)
4. **Role Validation**: Backend validates role on registration/login
5. **Session Expiry**: Supabase handles token refresh automatically

## Troubleshooting

### "No session found" Error
- Check if Google OAuth redirect URI is correct in Google Cloud Console
- Verify Supabase project URL matches environment variable
- Ensure cookies are enabled in browser

### "Role not found" Error
- Clear localStorage and try again
- Ensure role is selected before clicking Google Sign-In

### Backend Connection Failed
- Verify backend is running on port 5000
- Check CORS settings in backend (should allow localhost:5173)
- Verify MongoDB connection string

### Redirect Loop
- Clear browser cache and localStorage
- Check if `/auth/callback` route is properly configured
- Verify `redirectTo` URL matches actual callback URL

## Testing Checklist

- [ ] Student signup with Google
- [ ] Organizer signup with Google
- [ ] Admin signup with Google
- [ ] Student login with Google (existing user)
- [ ] Organizer login with Google (existing user)
- [ ] Admin login with Google (existing user)
- [ ] Signup with department and year fields
- [ ] Signup with club name field (organizers)
- [ ] Email/password signup still works
- [ ] Email/password login still works
- [ ] Logout and re-login
- [ ] Session persistence after page refresh
- [ ] Error handling for failed OAuth
- [ ] Mobile responsive UI

## Production Deployment

### Additional Steps for Production:

1. **Update Redirect URLs**:
   - Add production domain to Google OAuth credentials
   - Update Supabase redirect URLs
   - Update `redirectTo` in `signInWithGoogle()`

2. **Environment Variables**:
   - Use production Supabase URL
   - Use production backend API URL
   - Rotate JWT secret
   - Use secure cookie storage

3. **Security Enhancements**:
   - Implement rate limiting
   - Add CAPTCHA for bot protection
   - Use httpOnly cookies for tokens
   - Enable Supabase RLS policies
   - Add CSP headers

4. **Google OAuth Verification**:
   - Submit app for Google OAuth verification
   - Add privacy policy URL
   - Add terms of service URL
   - Configure OAuth consent screen

## Support

For issues or questions:
1. Check Supabase logs: Authentication > Logs
2. Check browser console for frontend errors
3. Check backend terminal for API errors
4. Review MongoDB logs for database issues

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [React Router Documentation](https://reactrouter.com)
