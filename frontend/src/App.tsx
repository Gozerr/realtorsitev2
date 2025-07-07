import React, { useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AppLayout from './components/AppLayout';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PropertiesPage from './pages/PropertiesPage';
import ClientsPage from './pages/ClientsPage';
import './App.css';
import NotificationsPage from './pages/NotificationsPage';
import SelectionPage from './pages/SelectionPage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthContext } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import MapSearchPage from './pages/MapSearchPage';
import { PropertiesProvider } from './context/PropertiesContext';
import CalendarPage from './pages/CalendarPage';
import PropertyDetailsPageClean from './pages/PropertyDetailsPageClean';
import ClientSelectionPage from './pages/ClientSelectionPage';
import ErrorBoundary from './components/ErrorBoundary';
import './animations.css';
import EducationPage from './pages/EducationPage';
import MyChatsPage from './pages/MyChatsPage';
import { YMaps, Map, Placemark } from 'react-yandex-maps';

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

function TestYandexMap() {
  return (
    <div style={{ width: 400, height: 300, border: '2px solid green', margin: 24 }}>
      <YMaps query={{ apikey: 'bd94e42f-2bde-4e23-aba5-09290180c984' }}>
        <Map
          defaultState={{ center: [57.6248966, 39.8915407], zoom: 16 }}
          width={400}
          height={300}
        >
          <Placemark geometry={[57.6248966, 39.8915407]} />
        </Map>
      </YMaps>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <PropertiesProvider>
      <NotificationProvider>
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
                  <Route path="properties/:id" element={<PropertyDetailsPageClean />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="selection" element={<SelectionPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="my-chats" element={<MyChatsPage />} />
                  <Route path="map" element={<MapSearchPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="client-selection/:token" element={<ClientSelectionPage />} />
                  <Route path="education" element={<EducationPage />} />
                </Route>
              </Routes>
            </Router>
          </ThemeProvider>
        </AuthProvider>
      </NotificationProvider>
    </PropertiesProvider>
    </ErrorBoundary>
  );
}

export default App;
