export interface UserDto {
  id: string;
  companyId?: string | null;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  role?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  birthDate?: string | null;
  role?: string;
}

export interface UpdateUserRequest {
  id: string;
  name: string;
  phone?: string;
  cpf?: string;
  birthDate?: string | null;
}

export interface CheckEmailResponse {
  exists: boolean;
  message: string;
}
