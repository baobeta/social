import { useState, FormEvent } from 'react';
import { UserRole, type RegisterData } from '@/types/auth';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

interface RegisterFormProps {
  formData: RegisterData;
  onFormDataChange: (data: RegisterData) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  loading?: boolean;
  error?: string | null;
  onSubmit: () => void;
}

const roleOptions = [
  { label: 'User', value: UserRole.USER },
  { label: 'Admin', value: UserRole.ADMIN },
];

export default function RegisterForm({
  formData,
  onFormDataChange,
  confirmPassword,
  onConfirmPasswordChange,
  loading = false,
  error = null,
  onSubmit,
}: RegisterFormProps) {
  const [usernameError, setUsernameError] = useState('');

  function validateUsername() {
    const usernamePattern = /^[a-zA-Z0-9_]+$/;

    if (!formData.username) {
      setUsernameError('Username is required');
      return false;
    }

    if (!usernamePattern.test(formData.username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (formData.username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    setUsernameError('');
    return true;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const isUsernameValid = validateUsername();
    const isValid =
      formData.fullName &&
      formData.username &&
      formData.password &&
      confirmPassword &&
      formData.password === confirmPassword &&
      !usernameError;

    if (isValid && isUsernameValid) {
      onSubmit();
    }
  }

  const isValid =
    formData.fullName &&
    formData.username &&
    formData.password &&
    confirmPassword &&
    formData.password === confirmPassword &&
    !usernameError;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <span className="text-red-500 mt-0.5">⚠</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
          Full Name
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🆔</span>
          <input
            id="fullName"
            type="text"
            required
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => onFormDataChange({ ...formData, fullName: e.target.value })}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700">
          Display Name
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">✏️</span>
          <input
            id="displayName"
            type="text"
            placeholder="Enter your display name (optional)"
            value={formData.displayName || ''}
            onChange={(e) => onFormDataChange({ ...formData, displayName: e.target.value })}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
          />
        </div>
        <small className="flex items-center gap-1 text-gray-500">ℹ Optional: How you want others to see your name</small>
      </div>

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
            value={formData.username}
            onChange={(e) => {
              onFormDataChange({ ...formData, username: e.target.value });
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
          <small className="flex items-center gap-1 text-gray-500">ℹ Only letters, numbers, and underscores (min 3 characters)</small>
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
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
          />
        </div>
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
          Confirm Password
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">🔒</span>
          <input
            id="confirmPassword"
            type="password"
            required
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors ${
              confirmPassword && confirmPassword !== formData.password ? 'border-red-400 focus:border-red-500' : ''
            }`}
          />
        </div>
        {confirmPassword && confirmPassword !== formData.password && (
          <small className="flex items-center gap-1 text-red-600">✗ Passwords do not match</small>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
          Role
        </label>
        <div className="relative">
          <select
            id="role"
            value={formData.role}
            onChange={(e) => onFormDataChange({ ...formData, role: e.target.value })}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <small className="flex items-center gap-1 text-gray-500">ℹ For demo purposes, you can choose your role</small>
      </div>

      <button
        type="submit"
        disabled={loading || !isValid}
        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Creating account...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>➕</span>
            Create Account
          </span>
        )}
      </button>
    </form>
  );
}

