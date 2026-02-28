export interface UserDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
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
}

export interface UpdateUserRequest {
  id: string;
  name: string;
  phone?: string;
  cpf?: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  message: string;
}
