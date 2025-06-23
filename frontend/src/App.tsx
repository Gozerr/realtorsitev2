import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
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
import { SelectionPage } from './pages/Placeholders';
import EducationPage from './pages/EducationPage';
import { ThemeProvider } from './context/ThemeContext';



function App() {
  const authContext = useContext(AuthContext);

  return (
    <AuthProvider>
      <ChatProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/login" element={!authContext?.token ? <LoginPage /> : <Navigate to="/" />} />
              <Route path="/" element={authContext?.token ? <AppLayout /> : <Navigate to="/login" />}>
                <Route index element={<DashboardPage />} />
                <Route path="properties" element={<PropertiesPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="selection" element={<SelectionPage />} />
                <Route path="chats" element={<ChatsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="education" element={<EducationPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Router>
        </ThemeProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
