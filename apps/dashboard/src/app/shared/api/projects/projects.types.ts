export interface ProjectDto {
  id: string;
  companyId?: string | null;
  companyName?: string;
  name: string;
  description?: string;
  objective?: string;
  status: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
  updatedAt?: string;
  taskCount?: number;
}

export interface ProjectMemberRequest {
  userId: string;
  projectFunction: string;
  dedication: string;
  approver: string;
  functionDescription?: string;
}

export interface CreateProjectRequest {
  userId: string;
  name: string;
  description?: string;
  objective?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  responsibleSector?: string;
  projectType?: string;
  members?: ProjectMemberRequest[];
}

export interface ProjectComplianceRequest {
  tipoCompliance: number;
  observacoes?: string;
}

export interface ProjectUnavailablePeriodRequest {
  dataInicio: string;
  dataFim: string;
  motivo?: string;
}

export interface ProjectDependencyRequest {
  nome: string;
  descricao: string;
  prazo?: string;
  criticidade: string;
}

export interface ProjectIntegrationRequest {
  nomeSistema: string;
  tipo: string;
  criticidade: string;
  status: number;
}

export interface ProjectSensitiveDataRequest {
  tipoDadoSensivel: number;
}

export interface ProjectDetailsRequest {
  projectId: string;
  temDependenciasExternas: boolean;
  temIntegracoes: boolean;
  orcamento: number;
  valorOrcamento?: number;
  horarioTrabalho: number;
  downtimePermitido: number;
  horasDowntime?: number;
  compliances: ProjectComplianceRequest[];
  unavailablePeriods: ProjectUnavailablePeriodRequest[];
  dependencies: ProjectDependencyRequest[];
  integrations: ProjectIntegrationRequest[];
  sensitiveData: ProjectSensitiveDataRequest[];
}

export interface ProjectPriorityRankingRequest {
  priorityType: number;
  posicao: number;
}

export interface ProjectExecutionSettingsRequest {
  experienciaEquipe: number;
  nivelDetalhePlano: number;
  frequenciaRevisao: number;
  maiorRisco?: string;
  observacoes?: string;
  oQueDeuCerto?: string;
  oQueDeuErrado?: string;
  prioridadesOrdenadas: ProjectPriorityRankingRequest[];
}

export interface UpdateProjectRequest {
  id: string;
  name: string;
  description?: string;
  objective?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  responsibleSector?: string;
  projectType?: string;
}

export interface UpdateProjectDetailsRequest {
  id: string;
  temDependenciasExternas: boolean;
  temIntegracoes: boolean;
  orcamento: number;
  valorOrcamento?: number;
  horarioTrabalho: number;
  downtimePermitido: number;
  horasDowntime?: number;
  dependencies: ProjectDependencyRequest[];
  integrations: ProjectIntegrationRequest[];
  sensitiveData: ProjectSensitiveDataRequest[];
}

// ─── Complete DTO (GET /complete) ───────────────────────────────────────────

export interface ProjectMemberCompleteDto {
  id: string;
  userId: string;
  userName?: string;
  projectFunction?: string;
  dedication?: string;
  approver?: string;
  functionDescription?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectComplianceCompleteDto {
  id: string;
  tipoCompliance: string;
  observacoes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectUnavailablePeriodCompleteDto {
  id: string;
  dataInicio: string;
  dataFim: string;
  motivo?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectDependencyCompleteDto {
  id: string;
  nome: string;
  descricao?: string;
  prazo: string;
  criticidade: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectIntegrationCompleteDto {
  id: string;
  nomeSistema: string;
  tipo: string;
  criticidade: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectSensitiveDataCompleteDto {
  id: string;
  tipoDadoSensivel: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectDetailsCompleteDto {
  id: string;
  temDependenciasExternas: boolean;
  temIntegracoes: boolean;
  orcamento: string;
  valorOrcamento?: number;
  horarioTrabalho: string;
  downtimePermitido: string;
  horasDowntime?: number;
  isActive: boolean;
  createdAt: string;
  compliances: ProjectComplianceCompleteDto[];
  unavailablePeriods: ProjectUnavailablePeriodCompleteDto[];
  dependencies: ProjectDependencyCompleteDto[];
  integrations: ProjectIntegrationCompleteDto[];
  sensitiveData: ProjectSensitiveDataCompleteDto[];
}

export interface ProjectPriorityRankingCompleteDto {
  id: string;
  posicao: number;
  priorityType: string;
}

export interface ProjectExecutionSettingsCompleteDto {
  id: string;
  experienciaEquipe: string;
  nivelDetalhePlano: string;
  frequenciaRevisao: string;
  maiorRisco?: string;
  observacoes?: string;
  oQueDeuCerto?: string;
  oQueDeuErrado?: string;
  isActive: boolean;
  createdAt: string;
  prioridadesOrdenadas: ProjectPriorityRankingCompleteDto[];
}

export interface ProjectCompleteDto {
  id: string;
  companyId?: string;
  companyName?: string;
  userId: string;
  userName?: string;
  name: string;
  objective?: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  responsibleSector?: string;
  projectType?: string;
  isActive: boolean;
  createdAt: string;
  members: ProjectMemberCompleteDto[];
  details?: ProjectDetailsCompleteDto;
  executionSettings?: ProjectExecutionSettingsCompleteDto;
}
