import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AppLayout from './components/AppLayout';
import {
  SelectionPage,
  ChatsPage,
  NotificationsPage,
  EducationPage,
  ProfilePage,
  SettingsPage,
} from './pages/Placeholders';
import PropertiesPage from './pages/PropertiesPage';
import ClientsPage from './pages/ClientsPage';
import './App.css';

function App() {
  const authContext = useContext(AuthContext);

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
