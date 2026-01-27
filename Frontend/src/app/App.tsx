import { useState } from 'react';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import StudentDashboard from './components/StudentDashboard';
import OrganizerDashboard from './components/OrganizerDashboard';
import AdminDashboard from './components/AdminDashboard';

type Screen = 'landing' | 'auth' | 'dashboard';
type Role = 'student' | 'organizer' | 'admin' | null;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const handleNavigateToAuth = () => {
    setSelectedRole(null);
    setCurrentScreen('auth');
  };

  const handleLogin = (role: 'student' | 'organizer' | 'admin') => {
    setSelectedRole(role);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setSelectedRole(null);
    setCurrentScreen('landing');
  };

  const handleBackToLanding = () => {
    setCurrentScreen('landing');
  };

  const handleBackToHome = () => {
    setSelectedRole(null);
    setCurrentScreen('landing');
  };

  return (
    <div className="size-full">
      {currentScreen === 'landing' && (
        <LandingPage onNavigate={handleNavigateToAuth} />
      )}

      {currentScreen === 'auth' && (
        <AuthScreen 
          onBack={handleBackToLanding}
          onLogin={handleLogin}
        />
      )}

      {currentScreen === 'dashboard' && selectedRole === 'student' && (
        <StudentDashboard onLogout={handleLogout} onHome={handleBackToHome} />
      )}

      {currentScreen === 'dashboard' && selectedRole === 'organizer' && (
        <OrganizerDashboard onLogout={handleLogout} onHome={handleBackToHome} />
      )}

      {currentScreen === 'dashboard' && selectedRole === 'admin' && (
        <AdminDashboard onLogout={handleLogout} onHome={handleBackToHome} />
      )}
    </div>
  );
}
