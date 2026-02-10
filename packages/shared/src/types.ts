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
