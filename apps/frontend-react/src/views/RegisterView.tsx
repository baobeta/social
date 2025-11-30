import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/auth/RegisterForm';
import { UserRole, type RegisterData } from '@/types/auth';

export default function RegisterView() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    password: '',
    fullName: '',
    role: UserRole.USER,
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleRegister() {
    if (formData.password !== confirmPassword) {
      return;
    }

    try {
      await register(formData);
      navigate('/timeline');
    } catch (err) {
      // Error is handled in the context
    }
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join our community today!">
      <RegisterForm
        formData={formData}
        onFormDataChange={setFormData}
        confirmPassword={confirmPassword}
        onConfirmPasswordChange={setConfirmPassword}
        loading={loading}
        error={error}
        onSubmit={handleRegister}
      />
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-700">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

