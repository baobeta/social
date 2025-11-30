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

function ErrorMessage({ error }: { error: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
      <span className="text-red-500 mt-0.5">⚠</span>
      <span className="text-sm">{error}</span>
    </div>
  );
}

function FormField({
  id,
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error = false,
  pattern,
  onBlur,
}: {
  id: string;
  label: string;
  icon: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  error?: boolean;
  pattern?: string;
  onBlur?: () => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">{icon}</span>
        <input
          id={id}
          type={type}
          required={required}
          pattern={pattern}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors ${
            error ? 'border-red-400 focus:border-red-500' : ''
          }`}
        />
      </div>
    </div>
  );
}

function UsernameField({
  value,
  onChange,
  error,
  onErrorChange,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  error: string;
  onErrorChange: (error: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="space-y-2">
      <FormField
        id="username"
        label="Username"
        icon="👤"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (error) onErrorChange('');
        }}
        placeholder="Enter your username"
        required
        pattern="[a-zA-Z0-9_]+"
        error={!!error}
        onBlur={onBlur}
      />
      {error ? (
        <small className="flex items-center gap-1 text-red-600">✗ {error}</small>
      ) : (
        <small className="flex items-center gap-1 text-gray-500">ℹ Only letters, numbers, and underscores (min 3 characters)</small>
      )}
    </div>
  );
}

function PasswordField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <FormField
        id="password"
        label="Password"
        icon="🔒"
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Create a strong password"
        required
      />
      <PasswordStrengthIndicator password={value} />
    </div>
  );
}

function ConfirmPasswordField({
  value,
  password,
  onChange,
}: {
  value: string;
  password: string;
  onChange: (value: string) => void;
}) {
  const hasError = Boolean(value && value !== password);
  return (
    <div className="space-y-2">
      <FormField
        id="confirmPassword"
        label="Confirm Password"
        icon="🔒"
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Re-enter your password"
        required
        error={hasError}
      />
      {hasError && (
        <small className="flex items-center gap-1 text-red-600">✗ Passwords do not match</small>
      )}
    </div>
  );
}

function RoleSelectField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
        Role
      </label>
      <div className="relative">
        <select
          id="role"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
  );
}

function SubmitButton({ loading, disabled }: { loading: boolean; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
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
  );
}

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

  const isValid =
    formData.fullName &&
    formData.username &&
    formData.password &&
    confirmPassword &&
    formData.password === confirmPassword &&
    !usernameError;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const isUsernameValid = validateUsername();

    if (isValid && isUsernameValid) {
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <ErrorMessage error={error} />}

      <FormField
        id="fullName"
        label="Full Name"
        icon="🆔"
        value={formData.fullName}
        onChange={(e) => onFormDataChange({ ...formData, fullName: e.target.value })}
        placeholder="Enter your full name"
        required
      />

      <UsernameField
        value={formData.username}
        onChange={(value) => onFormDataChange({ ...formData, username: value })}
        error={usernameError}
        onErrorChange={setUsernameError}
        onBlur={validateUsername}
      />

      <PasswordField
        value={formData.password}
        onChange={(value) => onFormDataChange({ ...formData, password: value })}
      />

      <ConfirmPasswordField
        value={confirmPassword}
        password={formData.password}
        onChange={onConfirmPasswordChange}
      />

      <RoleSelectField
        value={formData.role}
        onChange={(value) => onFormDataChange({ ...formData, role: value })}
      />

      <SubmitButton loading={loading} disabled={!isValid || loading} />
    </form>
  );
}

