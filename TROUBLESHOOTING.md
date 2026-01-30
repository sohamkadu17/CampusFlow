# Troubleshooting Guide

## Current Issues & Solutions

### Issue 1: Regular Sign Up - "Request failed with status code 409"

**Error**: `Request failed with status code 409`  
**Meaning**: HTTP 409 = Conflict - User already exists

**Solution**:
1. The email `soham.kadu24@vit.edu` is already registered in the database
2. Options:
   - Use "Sign In" instead of "Sign Up"
   - Use a different email address
   - Delete the existing user from MongoDB to re-register

**To delete existing user (if needed)**:
```javascript
// Connect to MongoDB and run:
db.users.deleteOne({ email: "soham.kadu24@vit.edu" })
```

### Issue 2: Google OAuth - "User data not found"

**Error**: `Authentication Failed - User data not found. Please try again.`

**Root Cause**: The `getSession()` method was being called incorrectly. It returns `{ data, error }` but the code was treating it as if it returned the session directly.

**Fix Applied**:
- Updated `AuthCallback.tsx` to properly destructure the response:
```typescript
// Before (incorrect):
const session = await auth.getSession();

// After (correct):
const { data: sessionData, error: sessionError } = await auth.getSession();
const session = sessionData.session;
```

**Added Debug Logging**:
- Console logs to track the OAuth flow
- Check browser console (F12) for detailed error messages

## Testing Steps

### Test Regular Sign Up:
1. Use a NEW email address (not `soham.kadu24@vit.edu`)
2. Fill in all required fields
3. Click "Sign Up"
4. Check for OTP email (note: email sending might fail due to SMTP config)

### Test Regular Sign In:
1. Use existing email: `soham.kadu24@vit.edu`
2. Use password: `Soham@1711`
3. Click "Sign In"
4. Should work if user is verified

### Test Google OAuth:
1. Clear browser localStorage: 
   - Open Console (F12)
   - Run: `localStorage.clear()`
2. Go to http://localhost:5173
3. Click "Get Started"
4. Select a role (Student/Organizer/Admin)
5. Click "Sign up with Google"
6. Check browser console for debug logs:
   - `🔍 Starting OAuth callback...`
   - `📦 Session data:` (should show session object)
   - `👤 User from session:` (should show user data)
   - `🎭 Pending role:` (should show selected role)

## Common Errors

### "Email already exists" (409)
- **Solution**: Use different email or sign in with existing account

### "Please verify your email first" (401)
- **Issue**: User registered but not verified
- **Solution**: 
  1. Check email for OTP
  2. OR manually verify in database:
     ```javascript
     db.users.updateOne(
       { email: "your@email.com" },
       { $set: { isVerified: true } }
     )
     ```

### "No session found"
- **Issue**: OAuth redirect didn't store session
- **Solution**:
  1. Verify Google provider is enabled in Supabase
  2. Check redirect URLs match exactly
  3. Clear browser cache and try again

### "Role not found"
- **Issue**: Role wasn't stored before OAuth redirect
- **Solution**:
  1. Make sure to select a role BEFORE clicking Google button
  2. Check if localStorage is being blocked

## Environment Check

### Frontend is running?
```bash
# Should show: http://localhost:5173/
curl http://localhost:5173
```

### Backend is running?
```bash
# Should show: {"message":"Server is running"}
curl http://localhost:5000
```

### Supabase Google OAuth enabled?
1. Go to: https://cklblrotmhchvgeyllyg.supabase.co
2. Authentication → Providers → Google
3. Toggle should be ON
4. Client ID and Secret should be filled

## Debug Commands

### View browser console logs:
- Press F12
- Go to Console tab
- Look for emoji logs: 🔍 📦 👤 🎭

### View backend logs:
- Check the terminal where `pnpm run dev` is running
- Look for POST requests and error messages

### Check MongoDB connection:
- Backend should show: `✅ MongoDB connected successfully`
- If not, check connection string in `.env`

### Test Supabase connection:
```javascript
// In browser console:
import { supabase } from './lib/supabase';
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data, 'Error:', error);
```

## Next Steps

1. **If regular signup fails with 409**: Try signing in or use different email
2. **If Google OAuth fails**: Check browser console for specific error
3. **If still not working**: Share the console logs for detailed debugging
