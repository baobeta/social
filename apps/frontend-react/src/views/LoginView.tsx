import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import type { LoginCredentials } from '@/types/auth';

export default function LoginView() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });

  async function handleLogin() {
    try {
      await login(credentials);
      navigate('/timeline');
    } catch (err) {
      // Error is handled in the context
    }
  }

  return (
    <AuthLayout title="Sign In" subtitle="Welcome back! Please sign in to your account.">
      <LoginForm
        credentials={credentials}
        onCredentialsChange={setCredentials}
        loading={loading}
        error={error}
        onSubmit={handleLogin}
      />
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-green-600 hover:text-green-700">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

