import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/supabase';
import { authAPI } from '../../services/api';

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      setStatus('loading');

      console.log('🔍 Starting OAuth callback...');

      // Get the session from Supabase
      const { data: sessionData, error: sessionError } = await auth.getSession();
      console.log('📦 Session data:', sessionData);
      console.log('❌ Session error:', sessionError);
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!sessionData?.session) {
        console.error('❌ No session in sessionData');
        throw new Error('No session found. Please try signing in again.');
      }

      const session = sessionData.session;
      const user = session.user;
      console.log('👤 User from session:', user);

      // Get stored role from localStorage
      const pendingRole = localStorage.getItem('pendingRole');
      console.log('🎭 Pending role:', pendingRole);
      
      if (!pendingRole) {
        throw new Error('Role not found. Please try signing in again.');
      }

      // Validate user data from Supabase
      if (!user || !user.email) {
        console.error('❌ No user or email in session');
        throw new Error('User data not found. Please try again.');
      }

      // Check if this is a signup flow
      const pendingSignupData = localStorage.getItem('pendingSignupData');
      const signupData = pendingSignupData ? JSON.parse(pendingSignupData) : null;

      // Prepare user data for backend
      const userData = {
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        role: pendingRole,
        department: signupData?.department || '',
        year: signupData?.year ? parseInt(signupData.year) : undefined,
        clubs: signupData?.clubName ? [{
          clubId: signupData.clubName.toLowerCase().replace(/\s+/g, '-'),
          clubName: signupData.clubName,
          role: 'member',
          joinedAt: new Date()
        }] : [],
        googleId: user.id,
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture
      };

      let backendUser;
      
      try {
        // Try to log in first (user might already exist)
        const { data: loginData } = await authAPI.login({
          email: user.email,
          password: user.id, // Use Google ID as password for OAuth users
          role: pendingRole
        });

        // Store backend tokens
        localStorage.setItem('token', loginData.data.token);
        localStorage.setItem('refreshToken', loginData.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(loginData.data.user));
        backendUser = loginData.data.user;
      } catch (loginError: any) {
        // If login fails, register the user (but NOT for admin role)
        if (loginError.response?.status === 401 || loginError.response?.status === 404) {
          // Block admin registration - admins must exist in database already
          if (pendingRole === 'admin') {
            throw new Error('Admin account not found. Admin accounts must be created manually by system administrators.');
          }
          
          const { data: registerData } = await authAPI.register({
            ...userData,
            password: user.id, // Use Google ID as password for OAuth users
            isVerified: true // OAuth users are pre-verified by Google
          } as any);

          // Store backend tokens
          localStorage.setItem('token', registerData.data.token);
          localStorage.setItem('refreshToken', registerData.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(registerData.data.user));
          backendUser = registerData.data.user;
        } else {
          throw loginError;
        }
      }

      // Clean up pending data
      localStorage.removeItem('pendingRole');
      localStorage.removeItem('pendingSignupData');

      setStatus('success');

      // Check if profile is complete using the backend user data directly
      const isProfileComplete = backendUser.isProfileComplete !== false;

      // Determine redirect URL
      let redirectUrl = '/';
      if (!isProfileComplete) {
        redirectUrl = '/complete-profile';
      } else if (backendUser.role === 'admin') {
        redirectUrl = '/admin';
      } else if (backendUser.role === 'organizer') {
        redirectUrl = '/organizer';
      } else {
        redirectUrl = '/student';
      }

      // Use window.location for full page reload to ensure App state is initialized from localStorage
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);

    } catch (err: any) {
      console.error('OAuth callback error:', err);
      setStatus('error');
      setError(err.message || 'Authentication failed. Please try again.');
      
      // Clear stored OAuth data to prevent retry loop
      localStorage.removeItem('pendingRole');
      localStorage.removeItem('pendingSignupData');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Redirect back to login after 3 seconds using window.location
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Completing Sign In
            </h2>
            <p className="text-slate-600">
              Please wait while we set up your account...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Success!
            </h2>
            <p className="text-slate-600">
              Redirecting you to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Authentication Failed
            </h2>
            <p className="text-slate-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
