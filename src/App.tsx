import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import { FullScreenLoader } from './components/Spinner';
import { Toasts } from './components/Toasts';
import AppShell, { EmptyState } from './pages/AppShell';
import { LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages';
import ChatRoomPage from './pages/ChatRoomPage';
import NewGroupPage from './pages/NewGroupPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';

// LiveKit es pesado: se carga solo al iniciar/recibir una llamada
const CallPage = lazy(() => import('./pages/CallPage'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset" element={<ResetPasswordPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<EmptyState />} />
              <Route path="chat/:chatId" element={<ChatRoomPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="new-group" element={<NewGroupPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route
              path="call/:chatId"
              element={
                <Suspense fallback={<FullScreenLoader />}>
                  <CallPage />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toasts />
      </AuthProvider>
    </BrowserRouter>
  );
}
