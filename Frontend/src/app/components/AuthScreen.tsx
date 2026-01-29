import { useState } from 'react';
import { ArrowLeft, Sparkles, User, Users, Shield, Mail, Lock, Eye, EyeOff, CheckCircle  } from 'lucide-react';
import { auth } from '../../lib/supabase';
import { authAPI } from '../../services/api';

interface AuthScreenProps {
  onBack: () => void;
  onLogin: (role: 'student' | 'organizer' | 'admin') => void;
}

export default function AuthScreen({ onBack, onLogin }: AuthScreenProps) {
  const [step, setStep] = useState<'role' | 'auth'>('role');
  const [selectedRole, setSelectedRole] = useState<'student' | 'organizer' | 'admin' | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleConfig = {
    student: {
      title: 'Student Portal',
      description: 'Discover events, join clubs, and register for campus activities',
      icon: User,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-violet-50',
    },
    organizer: {
      title: 'Organizer Portal',
      description: 'Create events, manage resources, and track registrations',
      icon: Users,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-teal-50',
    },
    admin: {
      title: 'Admin Portal',
      description: 'Review submissions, approve events, and manage campus resources',
      icon: Shield,
      color: 'violet',
      gradient: 'from-violet-500 to-violet-600',
      bgGradient: 'from-violet-50 to-purple-50',
    },
  };

  const handleRoleSelect = (role: 'student' | 'organizer' | 'admin') => {
    setSelectedRole(role);
    setStep('auth');
  };

  const handleEmailVerification = () => {
    // Simulate email verification
    setTimeout(() => {
      setIsEmailVerified(true);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setError('Please select a role first.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (!isSignUp) {
        // Login flow - Try backend first, then Supabase
        try {
          const { data } = await authAPI.login({ email, password, role: selectedRole });
          
          // Store backend tokens
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          
          // Also sign in to Supabase (optional, for file storage/realtime features)
          try {
            await auth.signIn(email, password);
          } catch (supabaseError) {
            console.warn('Supabase sign-in failed:', supabaseError);
            // Continue anyway since backend login succeeded
          }
          
          onLogin(selectedRole);
        } catch (backendError: any) {
          // If backend fails, show more helpful error
          if (backendError.code === 'ERR_NETWORK' || backendError.message?.includes('Network Error')) {
            throw new Error('Cannot connect to server. Please ensure the backend is running.');
          }
          throw new Error(backendError.response?.data?.message || 'Invalid email or password');
        }
      } else {
        // Registration flow
        const { error: signUpError } = await auth.signUp(email, password, { name, role: selectedRole });
        if (signUpError) throw signUpError;

        // Sync with backend
        await authAPI.register({ email, password, name, role: selectedRole });
        
        alert('Registration successful! Please check your email to verify your account.');
        setIsSignUp(false);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>

          {/* Role Selection */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Role</h1>
            <p className="text-lg text-slate-600">Select how you want to use CampusFlow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(roleConfig).map(([role, config]) => {
              const IconComponent = config.icon;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role as 'student' | 'organizer' | 'admin')}
                  className="group p-8 bg-white rounded-3xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{config.title}</h3>
                  <p className="text-slate-600 mb-4">{config.description}</p>
                  <div className="flex items-center gap-2 text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    <span className="font-medium">Select</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const config = selectedRole ? roleConfig[selectedRole] : roleConfig.student;
  const IconComponent = config.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-6`}>
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={() => setStep('role')}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Role Selection
        </button>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-br ${config.gradient} p-8 text-white`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <IconComponent className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl">{config.title}</h1>
              </div>
            </div>
            <p className="text-white/90">{config.description}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Sign Up Name Field */}
            {isSignUp && (
              <div>
                <label className="block text-sm text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`${selectedRole}@university.edu`}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
              {isSignUp && email && !isEmailVerified && (
                <button
                  type="button"
                  onClick={handleEmailVerification}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Verify Email
                </button>
              )}
              {isSignUp && isEmailVerified && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Email verified
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
                />
                <span className="text-sm text-slate-700">Remember me</span>
              </label>
              <button type="button" className="text-sm text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-4 rounded-2xl bg-gradient-to-r ${config.gradient} text-white hover:shadow-lg transition-all shadow-${config.color}-600/25 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={loading || (isSignUp && !isEmailVerified)}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>

            {/* Toggle Sign In/Up */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setIsEmailVerified(false);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="pt-4 border-t border-slate-200">
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="text-xs text-slate-600 mb-2">Demo Credentials:</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-slate-700 font-mono">{selectedRole}@demo.edu</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Password:</span>
                    <span className="text-slate-700 font-mono">demo123</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
