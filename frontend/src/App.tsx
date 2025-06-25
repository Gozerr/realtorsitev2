import React, { useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AppLayout from './components/AppLayout';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PropertiesPage from './pages/PropertiesPage';
import ClientsPage from './pages/ClientsPage';
import ChatsPage from './pages/ChatsPage';
import './App.css';
import NotificationsPage from './pages/NotificationsPage';
import SelectionPage from './pages/SelectionPage';
import EducationPage from './pages/EducationPage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthContext } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import MapSearchPage from './pages/MapSearchPage';

// ProtectedRoute: только для авторизованных
function ProtectedRoute({ children }: { children: ReactNode }) {
  const authContext = useContext(AuthContext);
  if (!authContext?.token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
// PublicRoute: только для неавторизованных
function PublicRoute({ children }: { children: ReactNode }) {
  const authContext = useContext(AuthContext);
  if (authContext?.token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <NotificationProvider>
      <ChatProvider>
        <AuthProvider>
          <ThemeProvider>
            <Router>
              <Routes>
                <Route path="/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<DashboardPage />} />
                  <Route path="properties" element={<PropertiesPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="selection" element={<SelectionPage />} />
                  <Route path="chats" element={<ChatsPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="education" element={<EducationPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="map" element={<MapSearchPage />} />
                </Route>
              </Routes>
            </Router>
          </ThemeProvider>
        </AuthProvider>
      </ChatProvider>
    </NotificationProvider>
  );
}

export default App;
