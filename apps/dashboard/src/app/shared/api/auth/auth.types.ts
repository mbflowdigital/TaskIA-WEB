export interface LoginRequest {
  cpf: string;
  password: string;
}

export interface LoginData {
  userId: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  isFirstAccess: boolean;
  requiresOnboarding: boolean;
  role: string;
  token: string | null;
  tokenExpiration: string | null;
}

export interface LoginApiResult {
  isSuccess: boolean;
  message: string;
  data: LoginData | null;
  errors?: string[];
}

export interface ChangePasswordFirstAccessRequest {
  cpf: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
