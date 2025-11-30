import { createBrowserRouter, Navigate } from 'react-router-dom';
import HomeView from '@/views/HomeView';
import LoginView from '@/views/LoginView';
import RegisterView from '@/views/RegisterView';
import TimelineView from '@/views/TimelineView';
import NotFoundView from '@/views/NotFoundView';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '/home',
    element: (
      <PublicRoute>
        <HomeView />
      </PublicRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginView />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterView />
      </PublicRoute>
    ),
  },
  {
    path: '/timeline',
    element: (
      <ProtectedRoute>
        <TimelineView />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundView />,
  },
]);

