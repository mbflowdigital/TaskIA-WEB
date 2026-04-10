export interface UserDto {
  id: string;
  companyId?: string | null;
  companyName?: string | null;
  positionId?: number;
  positionName?: string | null;
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
  companyId?: string;
  positionId?: number;
}

export interface UpdateUserRequest {
  id: string;
  name: string;
  phone?: string;
  cpf?: string;
  birthDate?: string | null;
  companyId?: string;
  positionId?: number;
}

export interface CheckEmailResponse {
  exists: boolean;
  message: string;
}

export interface ViaCepDto {
  cep: string;
  logradouro: string;
  bairro: string;
  complemento: string;
  unidade: string;
  localidade: string;
  uf: string;
  estado: string;
  regioao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface ProfileImageDto {
  id: string;
  userId: string;
  contentType: string;
  fileSizeBytes: number;
  createdAt: string;
}
