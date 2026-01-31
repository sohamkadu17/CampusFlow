import { useState } from 'react';
import { ArrowLeft, Sparkles, User, Users, Shield, Mail, Lock, Eye, EyeOff, CheckCircle  } from 'lucide-react';
import { auth } from '../../lib/supabase';
import { authAPI } from '../../services/api';

interface AuthScreenProps {
  onBack: () => void;
  onLogin: (role: 'student' | 'organizer' | 'admin') => void;
}

export default function AuthScreen({ onBack, onLogin }: AuthScreenProps) {
  const [step, setStep] = useState<'role' | 'auth' | 'otp'>('role');
  const [selectedRole, setSelectedRole] = useState<'student' | 'organizer' | 'admin' | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [clubName, setClubName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
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

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (!name || !department || (selectedRole === 'student' && !year) || (selectedRole === 'organizer' && !clubName)) {
      setError('Please fill all required fields first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare club data if provided
      const clubData = clubName ? [{
        clubId: clubName.toLowerCase().replace(/\s+/g, '-'),
        clubName: clubName,
        role: 'member',
        joinedAt: new Date()
      }] : [];

      // Send OTP via backend registration
      await authAPI.register({ 
        email, 
        password, 
        name, 
        role: selectedRole!,
        department,
        year: year ? parseInt(year) : undefined,
        clubs: clubData
      } as any);

      setOtpSent(true);
      setShowOtpInput(true);
      setError('');
      alert('OTP sent to your email! Please check your inbox.');
    } catch (err: any) {
      console.error('❌ Error sending OTP:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP
      const { data } = await authAPI.verifyOTP({ email, otp });
      
      console.log('✅ OTP verified and registration complete!');
      
      // Store tokens
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Sign in to Supabase
      try {
        await auth.signIn(email, password);
      } catch (supabaseError) {
        console.warn('Supabase sign-in optional:', supabaseError);
      }
      
      alert('Email verified successfully! Welcome to CampusFlow!');
      onLogin(selectedRole!);
    } catch (err: any) {
      console.error('❌ Error verifying OTP:', err);
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      setError('Please select a role first');
      return;
    }

    // Block admin signup via OAuth - admins can only be created manually
    if (selectedRole === 'admin' && isSignUp) {
      setError('Admin accounts cannot be created via Google Sign-Up. Please sign in if you have an existing admin account.');
      return;
    }

    // If signing up, validate required fields are filled
    if (isSignUp) {
      if (!name) {
        setError('Please enter your name before signing up with Google');
        return;
      }
      if (!department) {
        setError('Please select your department before signing up with Google');
        return;
      }
      if (selectedRole === 'student' && !year) {
        setError('Please select your year before signing up with Google');
        return;
      }
      if (selectedRole === 'organizer' && !clubName) {
        setError('Please enter your club name before signing up with Google');
        return;
      }
    }
    
    setLoading(true);
    setError('');

    try {
      // Store the selected role to use after OAuth callback
      localStorage.setItem('pendingRole', selectedRole);
      
      // Store signup data if in signup mode
      if (isSignUp) {
        localStorage.setItem('pendingSignupData', JSON.stringify({
          name: name || '',
          department: department || '',
          year: year || '',
          clubName: clubName || ''
        }));
      }
      
      // Initiate Google OAuth flow
      await auth.signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setError('Please select a role first.');
      return;
    }
    
    console.log('🚀 Starting signup/login...', { isSignUp, email, selectedRole });
    
    setLoading(true);
    setError('');

    try {
      if (!isSignUp) {
        // Login flow - Try backend first, then Supabase
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
      } else {
        // Registration flow
        const { error: signUpError } = await auth.signUp(email, password, { 
          name, 
          role: selectedRole,
          department,
          year: year ? parseInt(year) : undefined
        });
        if (signUpError) throw signUpError;

        // Prepare club data if provided
        const clubData = clubName ? [{
          clubId: clubName.toLowerCase().replace(/\s+/g, '-'),
          clubName: clubName,
          role: 'member',
          joinedAt: new Date()
        }] : [];

        // Sync with backend
        await authAPI.register({ 
          email, 
          password, 
          name, 
          role: selectedRole,
          department,
          year: year ? parseInt(year) : undefined,
          clubs: clubData
        } as any);
        
        console.log('✅ Registration successful, redirecting to OTP screen...');
        
        // Switch to OTP verification screen
        setStep('otp');
        setError('');
      }
    } catch (err: any) {
      console.error('❌ Error during auth:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authAPI.verifyOTP({ email, otp });
      alert('Email verified successfully! You can now sign in.');
      setStep('auth');
      setIsSignUp(false);
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="w-full max-w-5xl relative z-10">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-8 transition-all hover:gap-3 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Choose Your Role
            </h1>
            <p className="text-slate-600 text-lg">
              Select how you want to use CampusFlow
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(roleConfig).map(([role, config]) => {
              const IconComponent = config.icon;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role as 'student' | 'organizer' | 'admin')}
                  className="group relative p-8 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text" style={{backgroundImage: `linear-gradient(135deg, ${config.gradient.split(' ')[1]}, ${config.gradient.split(' ')[3]})`}}>
                      {config.title}
                    </h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">{config.description}</p>
                    <div className="flex items-center gap-2 text-indigo-600 group-hover:gap-3 font-semibold transition-all">
                      <span>Get Started</span>
                      <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification Screen
  if (step === 'otp') {
    const config = selectedRole ? roleConfig[selectedRole] : roleConfig.student;
    const IconComponent = config.icon;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Back Button */}
          <button 
            onClick={() => setStep('auth')}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-8 transition-all hover:gap-3 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Sign Up
          </button>

          {/* OTP Verification Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-br ${config.gradient} p-8 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
              
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Mail className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
                <p className="text-white/90">We've sent a 6-digit code to</p>
                <p className="text-white font-semibold mt-1">{email}</p>
              </div>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleVerifyOTP} className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-6 py-4 text-center text-2xl font-bold tracking-widest rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Check your email inbox or spam folder
                </p>
              </div>

              <button
                type="submit"
                className={`w-full py-4 rounded-2xl bg-gradient-to-r ${config.gradient} text-white hover:shadow-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold`}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await authAPI.register({ email, password, name, role: selectedRole!, department, year: year ? parseInt(year) : undefined } as any);
                    alert('OTP resent! Please check your email.');
                  } catch (err: any) {
                    setError(err.message);
                  }
                }}
                className="w-full mt-4 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Resend Code
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const config = selectedRole ? roleConfig[selectedRole] : roleConfig.student;
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <button 
          onClick={() => setStep('role')}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-8 transition-all hover:gap-3 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Role Selection
        </button>

        {/* Auth Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
          {/* Header */}
          <div className={`bg-gradient-to-br ${config.gradient} p-8 text-white relative overflow-hidden`}>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <IconComponent className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{config.title}</h1>
                  <p className="text-white/90 text-sm">{isSignUp ? 'Create your account' : 'Welcome back!'}</p>
                </div>
              </div>
              <p className="text-white/90 leading-relaxed">{config.description}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp && showOtpInput ? handleVerifyAndSignUp : handleSubmit} className="p-8 space-y-6">
            {/* Sign Up Name Field */}
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${config.color}-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-2">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${config.color}-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Year field - Only for Students */}
                {selectedRole === 'student' && (
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${config.color}-500"
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                )}

                {/* Club field - For Students and Organizers */}
                {(selectedRole === 'student' || selectedRole === 'organizer') && (
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">
                      {selectedRole === 'organizer' ? 'Club Name (Required)' : 'Club Membership (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${config.color}-500"
                      placeholder="e.g., Tech Club, Cultural Club"
                      required={selectedRole === 'organizer'}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedRole === 'organizer' 
                        ? 'Specify the club you will be organizing events for'
                        : 'You can add more clubs later from your profile'}
                    </p>
                  </div>
                )}
              </>
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
                  disabled={otpSent}
                />
              </div>
              
              {/* Send OTP Button - Only show for signup */}
              {isSignUp && !otpSent && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading || !email || !name || !department || (selectedRole === 'student' && !year) || (selectedRole === 'organizer' && !clubName)}
                  className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              )}
              
              {/* OTP Input - Show after OTP is sent */}
              {isSignUp && showOtpInput && (
                <div className="mt-4">
                  <label className="block text-sm text-slate-700 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3.5 text-center text-xl font-bold tracking-widest rounded-2xl border-2 border-indigo-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Check your email inbox for the 6-digit code
                  </p>
                </div>
              )}
              
              {otpSent && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  OTP sent to your email
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
              className={`w-full py-4 rounded-2xl bg-gradient-to-r ${config.gradient} text-white hover:shadow-lg transition-all shadow-${config.color}-600/25 disabled:opacity-50 disabled:cursor-not-allowed font-semibold`}
              disabled={loading || (isSignUp && (!showOtpInput || otp.length !== 6))}
            >
              {loading ? 'Please wait...' : (isSignUp && showOtpInput ? 'Verify & Complete Signup' : isSignUp ? 'Sign Up' : 'Sign In')}
            </button>

            {/* Divider - Hide for Admin */}
            {selectedRole !== 'admin' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-slate-700 font-medium">
                    {isSignUp ? 'Sign up' : 'Sign in'} with Google
                  </span>
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
              </>
            )}

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
