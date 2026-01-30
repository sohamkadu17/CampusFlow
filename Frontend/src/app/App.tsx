import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import StudentDashboard from './components/StudentDashboard';
import OrganizerDashboard from './components/OrganizerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthCallback from './components/AuthCallback';

type Role = 'student' | 'organizer' | 'admin' | null;

function AppContent() {
  const [selectedRole, setSelectedRole] = useState<Role>(() => {
    // Initialize from localStorage if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user.role as Role;
      } catch {
        return null;
      }
    }
    return null;
  });
  const navigate = useNavigate();

  const handleNavigateToAuth = () => {
    setSelectedRole(null);
    navigate('/auth');
  };

  const handleLogin = (role: 'student' | 'organizer' | 'admin') => {
    setSelectedRole(role);
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'organizer') {
      navigate('/organizer');
    } else {
      navigate('/student');
    }
  };

  const handleLogout = () => {
    setSelectedRole(null);
    localStorage.clear();
    navigate('/');
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  const handleBackToHome = () => {
    setSelectedRole(null);
    navigate('/');
  };

  return (
    <div className="size-full">
      <Routes>
        <Route path="/" element={<LandingPage onNavigate={handleNavigateToAuth} />} />
        <Route 
          path="/auth" 
          element={
            <AuthScreen 
              onBack={handleBackToLanding}
              onLogin={handleLogin}
            />
          } 
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route 
          path="/student" 
          element={
            selectedRole === 'student' ? (
              <StudentDashboard onLogout={handleLogout} onHome={handleBackToHome} />
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        <Route 
          path="/organizer" 
          element={
            selectedRole === 'organizer' ? (
              <OrganizerDashboard onLogout={handleLogout} onHome={handleBackToHome} />
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        <Route 
          path="/admin" 
          element={
            selectedRole === 'admin' ? (
              <AdminDashboard onLogout={handleLogout} onHome={handleBackToHome} />
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
