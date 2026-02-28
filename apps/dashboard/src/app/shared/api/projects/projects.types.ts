export interface ProjectDto {
  id: string;
  name: string;
  description?: string;
  objective?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectRequest {
  userId: string;
  name: string;
  description?: string;
  objective?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateProjectRequest {
  id: string;
  userId: string;
  name: string;
  description?: string;
  objective?: string;
  startDate?: string | null;
  endDate?: string | null;
}
