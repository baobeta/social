export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  displayName?: string | null;
  role: string; // Changed from UserRole to string to match backend response
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  fullName: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  error: string | null;
}

export interface UpdateProfileData {
  fullName: string;
}
