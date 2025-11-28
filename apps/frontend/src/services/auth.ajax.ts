import { apiClient } from './api';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UpdateProfileData,
} from '@/types/auth';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

export async function updateProfile(data: UpdateProfileData): Promise<AuthResponse> {
  const response = await apiClient.patch('/users/me', data);
  return response.data;
}
