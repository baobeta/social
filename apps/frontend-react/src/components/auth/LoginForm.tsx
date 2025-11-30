import { useState, FormEvent } from 'react';
import type { LoginCredentials } from '@/types/auth';

interface LoginFormProps {
  credentials: LoginCredentials;
  onCredentialsChange: (credentials: LoginCredentials) => void;
  loading?: boolean;
  error?: string | null;
  onSubmit: () => void;
}

export default function LoginForm({
  credentials,
  onCredentialsChange,
  loading = false,
  error = null,
  onSubmit,
}: LoginFormProps) {
  const [usernameError, setUsernameError] = useState('');

  function validateUsername() {
    const usernamePattern = /^[a-zA-Z0-9_]+$/;

    if (!credentials.username) {
      setUsernameError('Username is required');
      return false;
    }

    if (!usernamePattern.test(credentials.username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    setUsernameError('');
    return true;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validateUsername()) {
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <span className="text-red-500 mt-0.5">⚠</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
          Username
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
          <input
            id="username"
            type="text"
            required
            pattern="[a-zA-Z0-9_]+"
            placeholder="Enter your username"
            value={credentials.username}
            onChange={(e) => {
              onCredentialsChange({ ...credentials, username: e.target.value });
              if (usernameError) setUsernameError('');
            }}
            onBlur={validateUsername}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors ${
              usernameError ? 'border-red-400 focus:border-red-500' : ''
            }`}
          />
        </div>
        {usernameError ? (
          <small className="flex items-center gap-1 text-red-600">✗ {usernameError}</small>
        ) : (
          <small className="flex items-center gap-1 text-gray-500">ℹ Only letters, numbers, and underscores allowed</small>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
          Password
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">🔒</span>
          <input
            id="password"
            type="password"
            required
            placeholder="Enter your password"
            value={credentials.password}
            onChange={(e) => onCredentialsChange({ ...credentials, password: e.target.value })}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Signing in...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>→</span>
            Sign In
          </span>
        )}
      </button>
    </form>
  );
}

