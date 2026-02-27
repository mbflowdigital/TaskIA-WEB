// Tipos compartilhados entre apps

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: User;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  team: User[];
  createdAt: Date;
  updatedAt: Date;
}

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};

// Shape compatível com Domain.Common.Result / Result<T> do backend
export type TaskiaResult = {
  isSuccess: boolean;
  message: string;
  errors: string[];
};

export type TaskiaResultWithData<T> = TaskiaResult & {
  data: T | null;
};

// Model compatível com Application.Core.DTOs.Users.UserDto
export type UserDto = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
};
