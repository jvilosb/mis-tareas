import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { CalendarProvider } from './context/CalendarContext';
import { LoginView } from './components/auth/LoginView';
import { AppLayout } from './components/layout/AppLayout';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl border border-[#DBE2E9] shadow-getram flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[#00205B] animate-ping opacity-75" />
          <span className="text-xs font-black uppercase tracking-wider text-[#00205B] font-main">
            Cargando RamTask...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <TaskProvider>
      <CalendarProvider>
        <AppLayout />
      </CalendarProvider>
    </TaskProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
