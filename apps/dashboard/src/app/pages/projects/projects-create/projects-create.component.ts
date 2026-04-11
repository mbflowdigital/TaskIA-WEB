import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, forkJoin, takeUntil, debounceTime, interval, switchMap, takeWhile, startWith } from 'rxjs';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ProjectsApiService } from '../../../shared/api/projects-api.service';
import { ProjectMemberRequest, ProjectDetailsRequest, ProjectExecutionSettingsRequest, UpdateProjectDetailsRequest, ProjectCompleteDto, ProjectMemberCompleteDto } from '../../../shared/api/projects/projects.types';
import { CompaniesApiService } from '../../../shared/api/companies-api.service';
import { UserDto } from '../../../shared/api/users/users.types';
import { UsersApiService } from '../../../shared/api/users-api.service';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ClaudeApiService, ProjectAnalysisRequest, ProjectAnalysisResult, GenerateTasksJobStatus, AnalyzeProjectJobStatus } from '../../../shared/api/claude-api.service';
import { DocumentsApiService, ExtractedTextResponse } from '../../../shared/api/documents-api.service';
import { BoardApiService, BoardTaskDto } from '../../../shared/api/board-api.service';

@Component({
  selector: 'app-projects-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, DragDropModule, NgbTooltipModule],
  templateUrl: './projects-create.component.html',
  styleUrls: ['./projects-create.component.scss']
})
export class ProjectsCreateComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly leadershipRoles = ['Patrocinador(a) do Projeto', 'Diretor(a)', 'Gerente de Projeto', 'Coordenador', 'Supervisor'];

  // Wizard
  currentStep = 1;
  readonly totalSteps = 5;

  companyDisplayName = 'Empresa';
  availableUsers: UserDto[] = [];
  loadingTeamData = false;

  isEditMode = false;
  editingProjectId?: string;
  createdProjectId?: string;
  isLoading = false;
  loadError?: string;

  // Edit mode state for tracking existing data
  private hasExistingDetails = false;
  private existingDetailsId?: string;
  private hasExistingExecutionSettings = false;
  private existingMembersMap = new Map<string, string>(); // userId → member backend ID
  private pendingEditMembers?: Array<{
    userId: string; userName: string; role: string;
    dedication: string; isApprover: boolean; roleDescription: string;
  }>;

  // Draft (localStorage autosave)
  hasDraft = false;
  draftSavedAt?: Date;
  private draftWatchActive = false;
  private draftKey(id: string): string { return `project-draft-${id}`; }

  isSubmitting = false;
  submitError?: string;
  submitErrors: string[] = [];
  submitSuccess?: string;
  analysisResult?: ProjectAnalysisResult;
  showRecommendations = false;
  isGeneratingTasks = false;
  generateTasksError?: string;
  currentTaskMessage = '';

  // Task review phases (0=none, 1=macro review, 2=subtasks display)
  taskReviewPhase = 0;
  generatedMacroTasks: BoardTaskDto[] = [];
  loadingGeneratedTasks = false;
  isDeletingTask = new Set<string>();
  private taskMessageInterval?: ReturnType<typeof setInterval>;

  private readonly taskMessages = [
    '🚀 Segura aí, as tarefas estão ficando prontas...',
    '🤖 A IA está destrinchando seu projeto em tarefas...',
    '⚙️ Montando o backlog com carinho e inteligência...',
    '🧠 Pensando nas melhores subtarefas para o seu time...',
    '📋 Organizando tudo em prioridades certeiras...',
    '✨ Quase lá! Finalizando os detalhes de cada tarefa...',
    '🎯 Ajustando prazos e responsáveis sugeridos...',
    '💡 Aplicando as melhores práticas de gestão de projetos...',
    '🔍 Revisando a coerência das tarefas geradas...',
    '📦 Empacotando as tarefas para o seu kanban...',
    '🏗️ Estruturando as dependências entre as tarefas...',
    '📊 Calculando o esforço estimado de cada entrega...',
    '🗂️ Classificando as tarefas por área e responsabilidade...',
    '🔗 Conectando as tarefas com os objetivos do projeto...',
    '🧩 Quebrando as entregas grandes em partes menores...',
    '📅 Distribuindo as tarefas ao longo do cronograma...',
    '🌐 Validando as integrações e dependências externas...',
    '🛡️ Verificando se os riscos estão cobertos pelas tarefas...',
    '📝 Adicionando descrições detalhadas em cada item...',
    '🎨 Finalizando os últimos ajustes antes de entregar...',
    '⏳ Isso pode levar um minutinho, mas vai valer a pena...',
    '☕ Pode pegar um café, estamos quase terminando...',
    '🏆 Gerando um backlog digno do seu projeto...',
    '💪 Trabalhando duro aqui pra te poupar horas de planejamento...',
    '🔮 Prevendo os próximos passos do seu projeto...',
  ];

  // ── AI Suggest Objective ────────────────────────────────────────────────
  isSuggestingObjective = false;
  suggestObjectiveError?: string;

  onSuggestObjective(): void {
    const name = (this.f['name'].value as string | undefined)?.trim();
    if (!name || this.isSuggestingObjective) return;
    this.isSuggestingObjective = true;
    this.suggestObjectiveError = undefined;
    this.claudeApi.suggestProject(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSuggestingObjective = false;
          if (res?.isSuccess && res.data) {
            this.form.patchValue({ objective: res.data.objective });
          } else {
            this.suggestObjectiveError = 'Não foi possível gerar sugestão. Tente novamente.';
          }
        },
        error: () => {
          this.isSuggestingObjective = false;
          this.suggestObjectiveError = 'Erro ao contatar a IA. Tente novamente.';
        }
      });
  }

  // ── Step 5 state ─────────────────────────────────────────────────────────

  get parsedRisks(): { level: string; label: string; items: string[] }[] {
    if (!this.analysisResult?.risks) return [];
    const levelMap: Record<string, string> = {
      CRITICO: 'Crítico',
      ALTO: 'Alto',
      MEDIO: 'Médio',
      BAIXO: 'Baixo'
    };
    return this.analysisResult.risks
      .split('|')
      .map(section => section.trim())
      .filter(section => section.length > 0)
      .map(section => {
        const colonIdx = section.indexOf(':');
        if (colonIdx === -1) return null;
        const level = section.slice(0, colonIdx).trim().toUpperCase();
        const items = section.slice(colonIdx + 1).split(',').map(i => i.trim()).filter(i => i.length > 0);
        return { level, label: levelMap[level] ?? level, items };
      })
      .filter((g): g is { level: string; label: string; items: string[] } => g !== null && g.items.length > 0);
  }

  get parsedRecommendations(): string[] {
    if (!this.analysisResult?.recommendations) return [];
    return this.analysisResult.recommendations
      .split(';')
      .map(r => r.trim())
      .filter(r => r.length > 0);
  }

  formSubmitted = false;

  priorityItems: string[] = ['Prazo', 'Qualidade', 'Custo', 'Escopo', 'Documentação'];

  // Step 5: generation animation (0=idle, 1=analyzing, 2=phases, 3=tasks, 4=done)
  generationStep = 0;
  private generationInterval?: ReturnType<typeof setInterval>;

  reviewOpenSections: Record<string, boolean> = { basic: true, team: true, context: true, priorities: true, files: true };

  // File upload state
  uploadedFiles: ExtractedTextResponse[] = [];
  isUploadingFile = false;
  fileUploadError?: string;
  uploadStage: 'idle' | 'uploading' | 'processing' | 'done' = 'idle';
  isDragOver = false;
  additionalContext = '';
  private readonly MAX_FILE_SIZE_MB = 20;
  private readonly MAX_FILE_SIZE_BYTES = this.MAX_FILE_SIZE_MB * 1024 * 1024;

  // Cache de imagens de perfil (userId -> ObjectURL)
  private profileImageCache = new Map<string, string>();

  toggleReviewSection(key: string): void {
    this.reviewOpenSections[key] = !this.reviewOpenSections[key];
  }

  get reviewBasicSummary(): string {
    const raw = this.form.getRawValue();
    const parts: string[] = [];
    if (raw.name) parts.push(raw.name);
    if (raw.department) parts.push(raw.department);
    if (raw.projectType) parts.push(raw.projectType);
    if (raw.startDate) parts.push(`Início: ${raw.startDate}`);
    return parts.join(' · ');
  }

  get reviewTeamSummary(): string {
    const selected = this.teamMembersArray.controls.filter(c => c.get('selected')?.value);
    const roles = [...new Set(selected.map(c => c.get('role')?.value).filter(Boolean))];
    return `${selected.length} membro${selected.length !== 1 ? 's' : ''}` + (roles.length ? ` · ${roles.slice(0, 3).join(', ')}${roles.length > 3 ? '...' : ''}` : '');
  }

  get reviewContextSummary(): string {
    const raw = this.form.getRawValue();
    const parts: string[] = [];
    const budgetMap: Record<string, string> = { unlimited: 'Sem limite', fixed: `R$ ${raw.budgetValue}`, tbd: 'Orç. a definir' };
    parts.push(budgetMap[raw.budgetType] ?? raw.budgetType);
    if (raw.hasExternalDependencies === 'yes') parts.push(`${(raw.externalDependencies as unknown[]).length} dependências`);
    if (raw.hasIntegrations === 'yes') parts.push(`${(raw.integrations as unknown[]).length} integrações`);
    const workMap: Record<string, string> = { commercial: 'expediente comercial', flexible: 'horário flexível', 'off-hours': 'fora do expediente' };
    parts.push(workMap[raw.workSchedule] ?? raw.workSchedule);
    return parts.join(' · ');
  }

  get reviewPrioritiesSummary(): string {
    const raw = this.form.getRawValue();
    const expMap: Record<string, string> = { never: 'Nunca fizemos', similar: 'Algo similar', exact: 'Exatamente isso' };
    const detailMap: Record<string, string> = { macro: 'Macro', balanced: 'Balanceado', granular: 'Granular' };
    const reviewMap: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal' };
    return [
      `1ª: ${this.priorityItems[0]}`,
      expMap[raw.previousExperience] ?? raw.previousExperience,
      detailMap[raw.detailLevel] ?? raw.detailLevel,
      reviewMap[raw.reviewFrequency] ?? raw.reviewFrequency
    ].join(' · ');
  }

  // TODO: replace with auth service when ready
  private get CURRENT_USER_ID(): string {
    return this.authSession.getUserId() ?? '';
  }

  // Validação customizada: data fim > data início
  private dateEndGreaterThanStart = (control: AbstractControl): ValidationErrors | null => {
    const form = control as UntypedFormGroup;
    if (!form.get('startDate') || !form.get('endDate')) return null;

    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;

    if (!startDate || !endDate) return null;

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return end > start ? null : { endDateInvalid: true };
  };

  form = new UntypedFormGroup({
    // TELA 1: DADOS BÁSICOS
    name: new UntypedFormControl('', Validators.required),
    objective: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(20)
    ]),
    startDate: new UntypedFormControl('', Validators.required),
    endDate: new UntypedFormControl(''),
    description: new UntypedFormControl('', [
      Validators.maxLength(3000) // ~30 linhas
    ]),

    // TELA 2: EQUIPE E FUNÇÕES
    department: new UntypedFormControl('', Validators.required),
    projectType: new UntypedFormControl('', Validators.required),
    teamMembers: new UntypedFormArray([], [this.teamSelectionValidator.bind(this)]),

    // TELA 3: CONTEXTO E RESTRIÇÕES
    hasExternalDependencies: new UntypedFormControl('no'),
    externalDependencies: new UntypedFormArray([]),
    budgetType: new UntypedFormControl('unlimited'),
    budgetValue: new UntypedFormControl(''),
    workSchedule: new UntypedFormControl('commercial'),
    downtimePolicy: new UntypedFormControl('na'),
    downtimeLimitHours: new UntypedFormControl(''),
    hasIntegrations: new UntypedFormControl('no'),
    integrations: new UntypedFormArray([]),
    compliance: new UntypedFormGroup({
      publicData: new UntypedFormControl(false),
      lgpd: new UntypedFormControl(false),
      pciDss: new UntypedFormControl(false),
      hipaa: new UntypedFormControl(false),
      iso27001: new UntypedFormControl(false),
      sox: new UntypedFormControl(false)
    }),
    complianceApprovers: new UntypedFormGroup({
      legal: new UntypedFormControl(false),
      security: new UntypedFormControl(false),
      dpo: new UntypedFormControl(false),
      complianceTeam: new UntypedFormControl(false)
    }),
    unavailablePeriods: new UntypedFormArray([]),

    // TELA 4: PRIORIDADES E EXPECTATIVAS
    biggestRisk: new UntypedFormControl(''),
    previousExperience: new UntypedFormControl('never'),
    whatWentWell: new UntypedFormControl(''),
    whatWentWrong: new UntypedFormControl(''),
    detailLevel: new UntypedFormControl('balanced'),
    reviewFrequency: new UntypedFormControl('weekly'),
    finalObservations: new UntypedFormControl('')
  }, { validators: this.dateEndGreaterThanStart });

  get f() { return this.form.controls; }
  get teamMembersArray(): UntypedFormArray { return this.form.get('teamMembers') as UntypedFormArray; }
  get externalDependenciesArray(): UntypedFormArray { return this.form.get('externalDependencies') as UntypedFormArray; }
  get integrationsArray(): UntypedFormArray { return this.form.get('integrations') as UntypedFormArray; }
  get unavailablePeriodsArray(): UntypedFormArray { return this.form.get('unavailablePeriods') as UntypedFormArray; }
  get complianceGroup(): UntypedFormGroup { return this.form.get('compliance') as UntypedFormGroup; }
  get hasSensitiveCompliance(): boolean {
    const c = this.form.get('compliance');
    return !!(c?.get('lgpd')?.value || c?.get('pciDss')?.value || c?.get('hipaa')?.value || c?.get('iso27001')?.value || c?.get('sox')?.value);
  }

  readonly departmentOptions = [
    // Diretoria / Estratégia
    'Diretoria / C-Level', 'Planejamento Estratégico',
    // Administrativo / Suporte
    'Administrativo', 'Jurídico / Compliance', 'RH / Gestão de Pessoas',
    // Financeiro
    'Financeiro / Controladoria', 'Compras / Procurement',
    // Comercial
    'Comercial / Vendas', 'Marketing', 'Atendimento ao Cliente',
    // Operações / Industrial
    'Operações', 'Produção', 'Manutenção', 'Qualidade', 'PCP',
    // Engenharia / Técnico
    'Engenharia', 'Logística / Supply Chain',
    // TI / Inovação
    'TI / Sistemas', 'Inovação & P&D',
    // Outros
    'HSE / Segurança', 'Outro'
  ];
  readonly projectTypeOptions = [
    // Estratégico / Executivo
    'Planejamento Estratégico', 'Transformação Digital', 'Reestruturação Organizacional',
    // Negócio
    'Lançamento de Produto / Serviço', 'Expansão de Mercado', 'Fusão & Aquisição',
    // Processos
    'Melhoria de Processos', 'Otimização de Custos', 'Conformidade / Adequação Regulatória',
    // Sistemas
    'Implantação de Sistema (ERP, CRM...)', 'Desenvolvimento de Software',
    // Industrial
    'Automação Industrial', 'Manutenção / Reforma', 'Ampliação de Capacidade',
    // Outros
    'Gestão de Mudança', 'Projeto de Infraestrutura', 'Outro'
  ];
  readonly roleOptions = [
    // Sponsor / Diretoria
    'Patrocinador(a) do Projeto', 'Diretor(a)',
    // Gestão
    'Gerente de Projeto',
    'Coordenador',
    'Supervisor',
    'Engenheiro',
    'Técnico',
    'Especialista',
    'Analista de Negócios',
    'Product Owner',
    'Consultor',
    'Analista',
    'Operador',
    'Assistente',
    'Administrador',
    'Consultor'
  ];
  readonly dedicationOptions = ['Integral', 'Parcial 50%', 'Parcial 25%', 'Consultor Pontual'];
  
  readonly criticalityOptions = ['Bloqueante', 'Importante', 'Desejável'];
  readonly integrationTypeOptions = [
    'API / Webservice', 'Banco de Dados',
    'ERP (SAP, TOTVS, Oracle...)', 'CRM (Salesforce, HubSpot...)',
    'BI / Analytics (Power BI, Tableau...)', 'Plataforma de RH (Workday, ADP...)',
    'Sistema MES', 'Sistema SCADA/IHM', 'CLP / PLC',
    'E-Commerce / Marketplace', 'Planilha / Excel', 'Outro'
  ];

  // ── Controles de dropdowns customizados ─────────────────────────────────
  departmentDropdownOpen = false;
  departmentSearchTerm = '';
  projectTypeDropdownOpen = false;
  projectTypeSearchTerm = '';
  addMemberDropdownOpen = false;
  addMemberSearchTerm = '';

  private readonly documentsApi = inject(DocumentsApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private readonly projectsApi: ProjectsApiService,
    private readonly companiesApi: CompaniesApiService,
    private readonly usersApi: UsersApiService,
    private readonly authSession: AuthSessionService,
    private readonly claudeApi: ClaudeApiService,
    private readonly boardApi: BoardApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const nameParam = this.route.snapshot.queryParamMap.get('name');

    const objectiveParam = this.route.snapshot.queryParamMap.get('objective');
    const descriptionParam = this.route.snapshot.queryParamMap.get('description');
    const sessionUser = this.authSession.getUser();
    const sessionRole = this.authSession.getRole().trim().toUpperCase();
    const companyId = (sessionUser?.companyId ?? '').trim();

    this.companyDisplayName = sessionUser?.companyName || 'Empresa';
    if (this.isValidGuid(companyId)) {
      this.initCompanyAndTeam(companyId, sessionRole);
    } else if (sessionUser?.userId) {
      // companyId não está na sessão: busca o perfil atualizado do usuário na API
      this.usersApi.getById(sessionUser.userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (r) => {
            if (r?.isSuccess && r.data) {
              const freshCompanyId = (r.data.companyId ?? '').trim();
              this.companyDisplayName = r.data.companyName || 'Empresa';
              // Atualiza a sessão com os dados mais recentes
              this.authSession.setUser({ ...sessionUser, companyId: freshCompanyId, companyName: r.data.companyName });
              if (this.isValidGuid(freshCompanyId)) {
                this.initCompanyAndTeam(freshCompanyId, sessionRole);
              }
            }
          }
        });
    }


    if (nameParam) {
      this.form.patchValue({
        name: nameParam,
        description: descriptionParam ?? '',
        objective: objectiveParam ?? ''
      });
    }
    if (objectiveParam) {
      this.form.patchValue({ objective: objectiveParam });
    }
    if (descriptionParam) {
      this.form.patchValue({ description: descriptionParam });
    }

    if (!id) return;

    this.isEditMode = true;
    this.editingProjectId = id;
    this.createdProjectId = id;
    this.isLoading = true;

    this.projectsApi
      .getComplete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (!result?.isSuccess || !result.data) {
            this.loadError = result?.message ?? 'Não foi possível carregar o projeto.';
            return;
          }
          this.populateFormFromComplete(result.data);
        },
        error: () => {
          this.isLoading = false;
          this.loadError = 'Erro inesperado ao carregar o projeto.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Libera todas as ObjectURLs do cache
    this.profileImageCache.forEach(url => URL.revokeObjectURL(url));
    this.profileImageCache.clear();
  }

  onReset(): void {
    this.form.reset({
      name: '',
      description: '',
      objective: '',
      startDate: '',
      endDate: '',
      department: '',
      projectType: '',
      hasExternalDependencies: 'no',
      budgetType: 'unlimited',
      budgetValue: '',
      workSchedule: 'commercial',
      downtimePolicy: 'na',
      downtimeLimitHours: '',
      hasIntegrations: 'no'
    });
    this.complianceGroup.reset({ publicData: false, lgpd: false, pciDss: false, hipaa: false, iso27001: false, sox: false });
    (this.form.get('complianceApprovers') as UntypedFormGroup).reset({ legal: false, security: false, dpo: false, complianceTeam: false });
    this.teamMembersArray.clear();
    this.externalDependenciesArray.clear();
    this.integrationsArray.clear();
    this.unavailablePeriodsArray.clear();
    this.teamMembersArray.updateValueAndValidity();
    this.priorityItems = ['Prazo', 'Qualidade', 'Custo', 'Escopo', 'Documentação'];
    this.generationStep = 0;
    this.reviewOpenSections = { basic: true, team: true, context: true, priorities: true, files: true };
    this.uploadedFiles = [];
    this.fileUploadError = undefined;
    this.uploadStage = 'idle';
    this.isDragOver = false;
    this.additionalContext = '';
    this.formSubmitted = false;
    this.submitError = undefined;
    this.submitErrors = [];
    this.submitSuccess = undefined;
    this.currentStep = 1;
  }

  // WIZARD: Validar apenas tela atual antes de avançar
  private isStep1Valid(): boolean {
    const name = this.f.name;
    const objective = this.f.objective;
    const startDate = this.f.startDate;
    const endDate = this.f.endDate;

    // Marcar campos como touched para mostrar erros
    name?.markAsTouched();
    objective?.markAsTouched();
    startDate?.markAsTouched();
    if (endDate?.value) endDate?.markAsTouched();

    // Validar cada campo obrigatório
    if (name?.invalid || objective?.invalid || startDate?.invalid) {
      return false;
    }

    // Validação cross-field: se endDate preenchida, deve ser > startDate
    if (endDate?.value && this.form.errors?.['endDateInvalid']) {
      return false;
    }

    return true;
  }

  private teamSelectionValidator(control: AbstractControl): ValidationErrors | null {
    const formArray = control as UntypedFormArray;
    const selected = formArray.controls.filter((member) => member.get('selected')?.value === true);

    const errors: ValidationErrors = {};

    if (selected.length === 0) {
      errors['teamRequired'] = true;
      return errors;
    }

    const hasLeader = selected.some((member) => this.isLeadershipRole(member.get('role')?.value));
    if (!hasLeader) {
      errors['leadershipRequired'] = true;
    }

    const hasApproverWithoutLeadership = selected.some((member) => {
      const isApprover = member.get('isApprover')?.value === true;
      const role = member.get('role')?.value;
      return isApprover && !this.isLeadershipRole(role);
    });

    if (hasApproverWithoutLeadership) {
      errors['approverLeadershipRequired'] = true;
    }

    const missingMemberFields = selected.some((member) => {
      const role = member.get('role')?.value;
      const dedication = member.get('dedication')?.value;
      return !role || !dedication;
    });

    if (missingMemberFields) {
      errors['memberFieldsRequired'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  private isLeadershipRole(role: string | null | undefined): boolean {
    return !!role && this.leadershipRoles.includes(role);
  }

  private createTeamMemberControl(user: UserDto): UntypedFormGroup {
    return new UntypedFormGroup({
      userId: new UntypedFormControl(user.id),
      userName: new UntypedFormControl(user.name),
      selected: new UntypedFormControl(true),
      role: new UntypedFormControl(''),
      dedication: new UntypedFormControl(''),
      isApprover: new UntypedFormControl(false),
      roleDescription: new UntypedFormControl(''),
      roleDropdownOpen: new UntypedFormControl(false),
      roleSearchTerm: new UntypedFormControl(''),
      dedicationDropdownOpen: new UntypedFormControl(false),
      dedicationSearchTerm: new UntypedFormControl('')
    });
  }

  private createEditMemberControl(data: {
    userId: string; userName: string; role: string;
    dedication: string; isApprover: boolean; roleDescription: string;
  }): UntypedFormGroup {
    return new UntypedFormGroup({
      userId: new UntypedFormControl(data.userId),
      userName: new UntypedFormControl(data.userName),
      selected: new UntypedFormControl(true),
      role: new UntypedFormControl(data.role),
      dedication: new UntypedFormControl(data.dedication),
      isApprover: new UntypedFormControl(data.isApprover),
      roleDescription: new UntypedFormControl(data.roleDescription),
      roleDropdownOpen: new UntypedFormControl(false),
      roleSearchTerm: new UntypedFormControl(''),
      dedicationDropdownOpen: new UntypedFormControl(false),
      dedicationSearchTerm: new UntypedFormControl('')
    });
  }

  toggleRoleDropdown(index: number, event: Event): void {
    event.stopPropagation();
    const member = this.teamMembersArray.at(index) as UntypedFormGroup;
    const isOpen = member.get('roleDropdownOpen')?.value;
    
    // Fecha todos os outros dropdowns
    this.teamMembersArray.controls.forEach((ctrl, i) => {
      if (i !== index) {
        ctrl.get('roleDropdownOpen')?.setValue(false);
      }
    });
    
    // Toggle o dropdown atual
    member.get('roleDropdownOpen')?.setValue(!isOpen);
    if (!isOpen) {
      member.get('roleSearchTerm')?.setValue('');
    }
  }

  selectRole(index: number, role: string): void {
    const member = this.teamMembersArray.at(index) as UntypedFormGroup;
    member.get('role')?.setValue(role);
    member.get('roleDropdownOpen')?.setValue(false);
    member.get('roleSearchTerm')?.setValue('');
  }

  updateRoleSearchTerm(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const member = this.teamMembersArray.at(index) as UntypedFormGroup;
    member.get('roleSearchTerm')?.setValue(input.value);
  }

  getFilteredRoles(searchTerm: string | null): string[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.roleOptions;
    }
    const term = searchTerm.toLowerCase();
    return this.roleOptions.filter(role => role.toLowerCase().includes(term));
  }

  // Fecha dropdowns ao clicar fora
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.departmentDropdownOpen = false;
    this.projectTypeDropdownOpen = false;
    this.addMemberDropdownOpen = false;
    this.teamMembersArray.controls.forEach(ctrl => {
      ctrl.get('roleDropdownOpen')?.setValue(false);
      ctrl.get('dedicationDropdownOpen')?.setValue(false);
    });
    this.externalDependenciesArray.controls.forEach(ctrl => {
      ctrl.get('criticalityDropdownOpen')?.setValue(false);
    });
    this.integrationsArray.controls.forEach(ctrl => {
      ctrl.get('typeDropdownOpen')?.setValue(false);
      ctrl.get('criticalityDropdownOpen')?.setValue(false);
    });
  }

  // ── Funções de controle do dropdown de Department ────────────────────────
  toggleDepartmentDropdown(event: Event): void {
    event.stopPropagation();
    this.departmentDropdownOpen = !this.departmentDropdownOpen;
    if (!this.departmentDropdownOpen) {
      this.departmentSearchTerm = '';
    }
  }

  selectDepartment(department: string): void {
    this.form.patchValue({ department });
    this.departmentDropdownOpen = false;
    this.departmentSearchTerm = '';
  }

  updateDepartmentSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.departmentSearchTerm = input.value;
  }

  getFilteredDepartments(): string[] {
    if (!this.departmentSearchTerm || this.departmentSearchTerm.trim() === '') {
      return this.departmentOptions;
    }
    const term = this.departmentSearchTerm.toLowerCase();
    return this.departmentOptions.filter(dept => dept.toLowerCase().includes(term));
  }

  // ── Funções de controle do dropdown de Project Type ──────────────────────
  toggleProjectTypeDropdown(event: Event): void {
    event.stopPropagation();
    this.projectTypeDropdownOpen = !this.projectTypeDropdownOpen;
    if (!this.projectTypeDropdownOpen) {
      this.projectTypeSearchTerm = '';
    }
  }

  selectProjectType(projectType: string): void {
    this.form.patchValue({ projectType });
    this.projectTypeDropdownOpen = false;
    this.projectTypeSearchTerm = '';
  }

  updateProjectTypeSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.projectTypeSearchTerm = input.value;
  }

  getFilteredProjectTypes(): string[] {
    if (!this.projectTypeSearchTerm || this.projectTypeSearchTerm.trim() === '') {
      return this.projectTypeOptions;
    }
    const term = this.projectTypeSearchTerm.toLowerCase();
    return this.projectTypeOptions.filter(type => type.toLowerCase().includes(term));
  }

  // ── Funções de controle do dropdown de Add Member ────────────────────────
  toggleAddMemberDropdown(event: Event): void {
    event.stopPropagation();
    this.addMemberDropdownOpen = !this.addMemberDropdownOpen;
    if (!this.addMemberDropdownOpen) {
      this.addMemberSearchTerm = '';
    }
  }

  selectAddMember(userId: string): void {
    const user = this.availableUsers.find(u => u.id === userId);
    if (user) {
      const exists = this.teamMembersArray.controls.some(ctrl => ctrl.get('userId')?.value === user.id);
      if (!exists) {
        this.teamMembersArray.push(this.createTeamMemberControl(user));
      }
    }
    this.addMemberDropdownOpen = false;
    this.addMemberSearchTerm = '';
  }

  updateAddMemberSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addMemberSearchTerm = input.value;
  }

  getFilteredAvailableUsers(): UserDto[] {
    const unselected = this.unselectedUsers;
    if (!this.addMemberSearchTerm || this.addMemberSearchTerm.trim() === '') {
      return unselected;
    }
    const term = this.addMemberSearchTerm.toLowerCase();
    return unselected.filter(user => user.name.toLowerCase().includes(term));
  }

  // ── Funções de controle do dropdown de Dedication (por membro) ───────────
  toggleDedicationDropdown(index: number, event: Event): void {
    event.stopPropagation();
    const member = this.teamMembersArray.at(index) as UntypedFormGroup;
    const isOpen = member.get('dedicationDropdownOpen')?.value;
    
    // Fecha todos os outros dropdowns de dedicação
    this.teamMembersArray.controls.forEach((ctrl, i) => {
      if (i !== index) {
        ctrl.get('dedicationDropdownOpen')?.setValue(false);
      }
    });
    
    // Toggle o dropdown atual
    member.get('dedicationDropdownOpen')?.setValue(!isOpen);
    if (!isOpen) {
      member.get('dedicationSearchTerm')?.setValue('');
    }
  }

  selectDedication(index: number, dedication: string): void {
    const member = this.teamMembersArray.at(index) as UntypedFormGroup;
    member.get('dedication')?.setValue(dedication);
    member.get('dedicationDropdownOpen')?.setValue(false);
    member.get('dedicationSearchTerm')?.setValue('');
  }

  updateDedicationSearchTerm(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const member = this.teamMembersArray.at(index) as UntypedFormGroup;
    member.get('dedicationSearchTerm')?.setValue(input.value);
  }

  getFilteredDedications(searchTerm: string | null): string[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.dedicationOptions;
    }
    const term = searchTerm.toLowerCase();
    return this.dedicationOptions.filter(dedication => dedication.toLowerCase().includes(term));
  }

  // ── Funções de controle dos dropdowns do step 3 ──────────────────────────

  // Criticality (External Dependencies)
  toggleDependencyCriticalityDropdown(index: number, event: Event): void {
    event.stopPropagation();
    const dep = this.externalDependenciesArray.at(index) as UntypedFormGroup;
    const isOpen = dep.get('criticalityDropdownOpen')?.value;
    
    this.externalDependenciesArray.controls.forEach((ctrl, i) => {
      if (i !== index) {
        ctrl.get('criticalityDropdownOpen')?.setValue(false);
      }
    });
    
    dep.get('criticalityDropdownOpen')?.setValue(!isOpen);
    if (!isOpen) {
      dep.get('criticalitySearchTerm')?.setValue('');
    }
  }

  selectDependencyCriticality(index: number, criticality: string): void {
    const dep = this.externalDependenciesArray.at(index) as UntypedFormGroup;
    dep.get('criticality')?.setValue(criticality);
    dep.get('criticalityDropdownOpen')?.setValue(false);
    dep.get('criticalitySearchTerm')?.setValue('');
  }

  updateDependencyCriticalitySearchTerm(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const dep = this.externalDependenciesArray.at(index) as UntypedFormGroup;
    dep.get('criticalitySearchTerm')?.setValue(input.value);
  }

  // Integration Type
  toggleIntegrationTypeDropdown(index: number, event: Event): void {
    event.stopPropagation();
    const intg = this.integrationsArray.at(index) as UntypedFormGroup;
    const isOpen = intg.get('typeDropdownOpen')?.value;
    
    this.integrationsArray.controls.forEach((ctrl, i) => {
      if (i !== index) {
        ctrl.get('typeDropdownOpen')?.setValue(false);
      }
    });
    
    intg.get('typeDropdownOpen')?.setValue(!isOpen);
    if (!isOpen) {
      intg.get('typeSearchTerm')?.setValue('');
    }
  }

  selectIntegrationType(index: number, type: string): void {
    const intg = this.integrationsArray.at(index) as UntypedFormGroup;
    intg.get('type')?.setValue(type);
    intg.get('typeDropdownOpen')?.setValue(false);
    intg.get('typeSearchTerm')?.setValue('');
  }

  updateIntegrationTypeSearchTerm(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const intg = this.integrationsArray.at(index) as UntypedFormGroup;
    intg.get('typeSearchTerm')?.setValue(input.value);
  }

  getFilteredIntegrationTypes(searchTerm: string | null): string[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.integrationTypeOptions;
    }
    const term = searchTerm.toLowerCase();
    return this.integrationTypeOptions.filter(type => type.toLowerCase().includes(term));
  }

  // Integration Criticality
  toggleIntegrationCriticalityDropdown(index: number, event: Event): void {
    event.stopPropagation();
    const intg = this.integrationsArray.at(index) as UntypedFormGroup;
    const isOpen = intg.get('criticalityDropdownOpen')?.value;
    
    this.integrationsArray.controls.forEach((ctrl, i) => {
      if (i !== index) {
        ctrl.get('criticalityDropdownOpen')?.setValue(false);
      }
    });
    
    intg.get('criticalityDropdownOpen')?.setValue(!isOpen);
    if (!isOpen) {
      intg.get('criticalitySearchTerm')?.setValue('');
    }
  }

  selectIntegrationCriticality(index: number, criticality: string): void {
    const intg = this.integrationsArray.at(index) as UntypedFormGroup;
    intg.get('criticality')?.setValue(criticality);
    intg.get('criticalityDropdownOpen')?.setValue(false);
    intg.get('criticalitySearchTerm')?.setValue('');
  }

  updateIntegrationCriticalitySearchTerm(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const intg = this.integrationsArray.at(index) as UntypedFormGroup;
    intg.get('criticalitySearchTerm')?.setValue(input.value);
  }

  getFilteredCriticalities(searchTerm: string | null): string[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.criticalityOptions;
    }
    const term = searchTerm.toLowerCase();
    return this.criticalityOptions.filter(crit => crit.toLowerCase().includes(term));
  }

  private populateFormFromComplete(data: ProjectCompleteDto): void {
    // ── Step 1: basic fields ──────────────────────────────────────────────
    this.form.patchValue({
      name: data.name,
      objective: data.objective ?? '',
      description: data.description ?? '',
      startDate: data.startDate ? data.startDate.substring(0, 10) : '',
      endDate: data.endDate ? data.endDate.substring(0, 10) : ''
    });

    // ── Step 2: team ──────────────────────────────────────────────────────
    this.form.patchValue({
      department: data.responsibleSector ?? '',
      projectType: data.projectType ?? ''
    });

    const memberData = data.members.map(m => ({
      userId: m.userId,
      userName: m.userName ?? '',
      role: m.projectFunction ?? '',
      dedication: m.dedication ?? '',
      isApprover: m.approver?.toLowerCase() === 'sim',
      roleDescription: m.functionDescription ?? ''
    }));

    // Track existing member IDs for syncing on save
    this.existingMembersMap.clear();
    data.members.forEach(m => this.existingMembersMap.set(m.userId, m.id));

    if (!this.loadingTeamData) {
      // Team data already loaded — populate members now
      this.teamMembersArray.clear();
      memberData.forEach(m => this.teamMembersArray.push(this.createEditMemberControl(m)));
      this.teamMembersArray.updateValueAndValidity();
    } else {
      // Team data still loading — store for setTeamMembers callback
      this.pendingEditMembers = memberData;
    }

    // ── Step 3: details ───────────────────────────────────────────────────
    if (data.details) {
      this.hasExistingDetails = true;
      this.existingDetailsId = data.details.id;

      const budgetMap: Record<string, string> = {
        SemLimite: 'unlimited', ValorFixo: 'fixed', ADefinir: 'tbd'
      };
      const workMap: Record<string, string> = {
        Comercial: 'commercial', Flexivel: 'flexible', ForaDoExpediente: 'off-hours'
      };
      const downtimeMap: Record<string, string> = {
        NaoSeAplica: 'na', AteXHoras: 'limited', ZeroDowntime: 'zero'
      };

      this.form.patchValue({
        hasExternalDependencies: data.details.temDependenciasExternas ? 'yes' : 'no',
        hasIntegrations: data.details.temIntegracoes ? 'yes' : 'no',
        budgetType: budgetMap[data.details.orcamento] ?? 'unlimited',
        budgetValue: data.details.valorOrcamento ?? '',
        workSchedule: workMap[data.details.horarioTrabalho] ?? 'commercial',
        downtimePolicy: downtimeMap[data.details.downtimePermitido] ?? 'na',
        downtimeLimitHours: data.details.horasDowntime ?? ''
      });

      // Compliances → checkboxes
      const complianceMap: Record<string, string> = {
        DadosPublicos: 'publicData', LGPD: 'lgpd', PCI_DSS: 'pciDss',
        HIPAA: 'hipaa', ISO27001: 'iso27001', SOX: 'sox'
      };
      const complianceValues: Record<string, boolean> = {
        publicData: false, lgpd: false, pciDss: false, hipaa: false, iso27001: false, sox: false
      };
      data.details.compliances.forEach(c => {
        const key = complianceMap[c.tipoCompliance];
        if (key) complianceValues[key] = true;
      });
      this.complianceGroup.patchValue(complianceValues);

      // SensitiveData → approver checkboxes
      const sensitiveMap: Record<string, string> = {
        Juridico: 'legal', SegurancaDaInformacao: 'security', DPO: 'dpo', Compliance: 'complianceTeam'
      };
      const approverValues: Record<string, boolean> = {
        legal: false, security: false, dpo: false, complianceTeam: false
      };
      data.details.sensitiveData.forEach(s => {
        const key = sensitiveMap[s.tipoDadoSensivel];
        if (key) approverValues[key] = true;
      });
      (this.form.get('complianceApprovers') as UntypedFormGroup).patchValue(approverValues);

      // Unavailable periods
      this.unavailablePeriodsArray.clear();
      data.details.unavailablePeriods.forEach(p => {
        const ctrl = this.createUnavailablePeriodControl();
        ctrl.patchValue({
          startDate: p.dataInicio.substring(0, 10),
          endDate: p.dataFim.substring(0, 10),
          reason: p.motivo ?? ''
        });
        this.unavailablePeriodsArray.push(ctrl);
      });

      // External dependencies
      this.externalDependenciesArray.clear();
      data.details.dependencies.forEach(d => {
        const ctrl = this.createExternalDependencyControl();
        ctrl.patchValue({
          name: d.nome,
          whatIsNeeded: d.descricao ?? '',
          deadline: d.prazo ? d.prazo.substring(0, 10) : '',
          criticality: d.criticidade
        });
        this.externalDependenciesArray.push(ctrl);
      });

      // Integrations
      const integrationStatusMap: Record<string, string> = { Existe: 'exists', Criar: 'to-create' };
      this.integrationsArray.clear();
      data.details.integrations.forEach(i => {
        const ctrl = this.createIntegrationControl();
        ctrl.patchValue({
          systemName: i.nomeSistema,
          type: i.tipo,
          criticality: i.criticidade,
          status: integrationStatusMap[i.status] ?? 'exists'
        });
        this.integrationsArray.push(ctrl);
      });
    }

    // ── Step 4: execution settings ────────────────────────────────────────
    if (data.executionSettings) {
      this.hasExistingExecutionSettings = true;

      const expMap: Record<string, string> = {
        NuncaFizemos: 'never', AlgoSimilar: 'similar', ExatamenteIsso: 'exact'
      };
      const detailMap: Record<string, string> = {
        Macro: 'macro', Balanceado: 'balanced', Granular: 'granular'
      };
      const reviewMap: Record<string, string> = {
        Semanal: 'weekly', Quinzenal: 'biweekly', Mensal: 'monthly'
      };

      this.form.patchValue({
        previousExperience: expMap[data.executionSettings.experienciaEquipe] ?? 'never',
        detailLevel: detailMap[data.executionSettings.nivelDetalhePlano] ?? 'balanced',
        reviewFrequency: reviewMap[data.executionSettings.frequenciaRevisao] ?? 'weekly',
        biggestRisk: data.executionSettings.maiorRisco ?? '',
        finalObservations: data.executionSettings.observacoes ?? '',
        whatWentWell: data.executionSettings.oQueDeuCerto ?? '',
        whatWentWrong: data.executionSettings.oQueDeuErrado ?? ''
      });

      // Restore priority order
      const priorityLabelMap: Record<string, string> = {
        Prazo: 'Prazo', Qualidade: 'Qualidade', Custo: 'Custo',
        Escopo: 'Escopo', Documentacao: 'Documentação'
      };
      const sorted = [...data.executionSettings.prioridadesOrdenadas].sort((a, b) => a.posicao - b.posicao);
      if (sorted.length === 5) {
        this.priorityItems = sorted.map(p => priorityLabelMap[p.priorityType] ?? p.priorityType);
      }
    }

    // Se o projeto já tem análise IA salva, exibir diretamente no passo 5
    if (data.iaOverview) {
      this.analysisResult = {
        overview: data.iaOverview,
        risks: data.iaRisks ?? '',
        recommendations: data.iaRecommendations ?? ''
      };
      this.currentStep = 5;
      this.showRecommendations = true;
    }

    this.checkForDraft();
    this.startDraftWatch();
  }

  // ── Draft /localStorage ──────────────────────────────────────────────────

  private checkForDraft(): void {
    if (!this.editingProjectId) return;
    const raw = localStorage.getItem(this.draftKey(this.editingProjectId));
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { formValues: any; priorityItems: string[]; savedAt: string };
      this.hasDraft = true;
      this.draftSavedAt = new Date(draft.savedAt);
    } catch {
      localStorage.removeItem(this.draftKey(this.editingProjectId));
    }
  }

  private startDraftWatch(): void {
    if (this.draftWatchActive) return;
    this.draftWatchActive = true;
    this.form.valueChanges
      .pipe(debounceTime(800), takeUntil(this.destroy$))
      .subscribe(() => this.saveDraftToStorage());
  }

  private saveDraftToStorage(): void {
    if (!this.editingProjectId) return;
    const draft = {
      formValues: this.form.getRawValue(),
      priorityItems: this.priorityItems,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(this.draftKey(this.editingProjectId), JSON.stringify(draft));
  }

  clearDraft(): void {
    if (!this.editingProjectId) return;
    localStorage.removeItem(this.draftKey(this.editingProjectId));
    this.hasDraft = false;
  }

  discardDraft(): void {
    this.clearDraft();
  }

  restoreDraft(): void {
    if (!this.editingProjectId) return;
    const raw = localStorage.getItem(this.draftKey(this.editingProjectId));
    if (!raw) { this.hasDraft = false; return; }
    try {
      const draft = JSON.parse(raw) as { formValues: any; priorityItems: string[]; savedAt: string };
      this.applyDraftToForm(draft.formValues, draft.priorityItems);
      this.hasDraft = false;
    } catch {
      localStorage.removeItem(this.draftKey(this.editingProjectId));
      this.hasDraft = false;
    }
  }

  private applyDraftToForm(values: any, priorityItems: string[]): void {
    this.form.patchValue({
      name: values.name,
      objective: values.objective,
      description: values.description,
      startDate: values.startDate,
      endDate: values.endDate,
      department: values.department,
      projectType: values.projectType,
      hasExternalDependencies: values.hasExternalDependencies,
      budgetType: values.budgetType,
      budgetValue: values.budgetValue,
      workSchedule: values.workSchedule,
      downtimePolicy: values.downtimePolicy,
      downtimeLimitHours: values.downtimeLimitHours,
      hasIntegrations: values.hasIntegrations,
      biggestRisk: values.biggestRisk,
      previousExperience: values.previousExperience,
      whatWentWell: values.whatWentWell,
      whatWentWrong: values.whatWentWrong,
      detailLevel: values.detailLevel,
      reviewFrequency: values.reviewFrequency,
      finalObservations: values.finalObservations
    });

    if (values.compliance) this.complianceGroup.patchValue(values.compliance);
    if (values.complianceApprovers) (this.form.get('complianceApprovers') as UntypedFormGroup).patchValue(values.complianceApprovers);

    this.teamMembersArray.clear();
    (values.teamMembers as any[] ?? []).forEach((m: any) => {
      this.teamMembersArray.push(this.createEditMemberControl({
        userId: m.userId, userName: m.userName, role: m.role,
        dedication: m.dedication, isApprover: m.isApprover, roleDescription: m.roleDescription
      }));
    });
    this.teamMembersArray.updateValueAndValidity();

    this.externalDependenciesArray.clear();
    (values.externalDependencies as any[] ?? []).forEach((d: any) => {
      const ctrl = this.createExternalDependencyControl();
      ctrl.patchValue({ name: d.name, whatIsNeeded: d.whatIsNeeded, deadline: d.deadline, criticality: d.criticality });
      this.externalDependenciesArray.push(ctrl);
    });

    this.integrationsArray.clear();
    (values.integrations as any[] ?? []).forEach((i: any) => {
      const ctrl = this.createIntegrationControl();
      ctrl.patchValue({ systemName: i.systemName, type: i.type, criticality: i.criticality, status: i.status });
      this.integrationsArray.push(ctrl);
    });

    this.unavailablePeriodsArray.clear();
    (values.unavailablePeriods as any[] ?? []).forEach((p: any) => {
      const ctrl = this.createUnavailablePeriodControl();
      ctrl.patchValue({ startDate: p.startDate, endDate: p.endDate, reason: p.reason });
      this.unavailablePeriodsArray.push(ctrl);
    });

    if (priorityItems?.length === 5) {
      this.priorityItems = priorityItems;
    }
  }

  private setTeamMembers(users: UserDto[]): void {
    this.availableUsers = users;
    this.teamMembersArray.clear();
    if (this.pendingEditMembers) {
      this.pendingEditMembers.forEach(m => this.teamMembersArray.push(this.createEditMemberControl(m)));
      this.pendingEditMembers = undefined;
    }
    this.teamMembersArray.updateValueAndValidity();
  }

  get unselectedUsers(): UserDto[] {
    const selectedIds = new Set(this.teamMembersArray.controls.map(c => c.get('userId')?.value));
    return this.availableUsers.filter(u => !selectedIds.has(u.id));
  }

  /**
   * Obtém a URL da imagem de perfil do usuário (carrega como blob se necessário)
   * @param userId ID do usuário
   * @returns URL da imagem ou string vazia se não houver userId
   */
  getUserProfileImageUrl(userId: string | null | undefined): string {
    if (!userId) return '';
    
    // Verifica se já está no cache
    if (this.profileImageCache.has(userId)) {
      return this.profileImageCache.get(userId)!;
    }
    
    // Carrega a imagem como blob
    this.usersApi.getProfileImageBlob(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          if (blob && blob.size > 0) {
            const url = URL.createObjectURL(blob);
            this.profileImageCache.set(userId, url);
            // Força detecção de mudanças para atualizar a view
            this.cdr.markForCheck();
          }
        },
        error: () => {
          // Ignora erro - o fallback de iniciais será exibido
        }
      });
    
    return ''; // Retorna vazio inicialmente, será atualizado quando carregar
  }

  /**
   * Obtém as iniciais do nome do usuário para exibir no avatar
   * @param userName Nome do usuário
   * @returns Iniciais (máximo 2 caracteres)
   */
  getUserInitials(userName: string | null | undefined): string {
    if (!userName) return '??';
    const names = userName.trim().split(/\s+/);
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  addMemberFromSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const userId = select.value;
    if (!userId) return;
    const user = this.availableUsers.find(u => u.id === userId);
    if (!user) return;
    this.teamMembersArray.push(this.createTeamMemberControl(user));
    this.teamMembersArray.updateValueAndValidity();
    select.value = '';
  }

  removeMember(index: number): void {
    this.teamMembersArray.removeAt(index);
    this.teamMembersArray.updateValueAndValidity();
  }

  // Dynamic lists: External Dependencies
  createExternalDependencyControl(): UntypedFormGroup {
    return new UntypedFormGroup({
      name: new UntypedFormControl('', Validators.required),
      whatIsNeeded: new UntypedFormControl('', Validators.required),
      deadline: new UntypedFormControl(''),
      criticality: new UntypedFormControl('', Validators.required),
      criticalityDropdownOpen: new UntypedFormControl(false),
      criticalitySearchTerm: new UntypedFormControl('')
    });
  }

  addExternalDependency(): void {
    this.externalDependenciesArray.push(this.createExternalDependencyControl());
  }

  removeExternalDependency(index: number): void {
    this.externalDependenciesArray.removeAt(index);
  }

  // Dynamic lists: Integrations
  createIntegrationControl(): UntypedFormGroup {
    return new UntypedFormGroup({
      systemName: new UntypedFormControl('', Validators.required),
      type: new UntypedFormControl('', Validators.required),
      criticality: new UntypedFormControl('', Validators.required),
      status: new UntypedFormControl('exists'),
      typeDropdownOpen: new UntypedFormControl(false),
      typeSearchTerm: new UntypedFormControl(''),
      criticalityDropdownOpen: new UntypedFormControl(false),
      criticalitySearchTerm: new UntypedFormControl('')
    });
  }

  addIntegration(): void {
    this.integrationsArray.push(this.createIntegrationControl());
  }

  removeIntegration(index: number): void {
    this.integrationsArray.removeAt(index);
  }

  // Dynamic lists: Unavailable Periods
  createUnavailablePeriodControl(): UntypedFormGroup {
    return new UntypedFormGroup({
      startDate: new UntypedFormControl('', Validators.required),
      endDate: new UntypedFormControl('', Validators.required),
      reason: new UntypedFormControl('')
    });
  }

  addUnavailablePeriod(): void {
    this.unavailablePeriodsArray.push(this.createUnavailablePeriodControl());
  }

  removeUnavailablePeriod(index: number): void {
    this.unavailablePeriodsArray.removeAt(index);
  }

  dropPriority(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.priorityItems, event.previousIndex, event.currentIndex);
    this.saveDraftToStorage();
  }

  private loadTeamData(companyId: string): void {
    this.loadingTeamData = true;

    this.companiesApi
      .getById(companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.isSuccess && result.data) {
            this.companyDisplayName = result.data.name || 'Empresa';
          }
        }
      });

    this.companiesApi
      .getUsersByCompany(companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.loadingTeamData = false;
          if (!result?.isSuccess || !Array.isArray(result.data)) {
            this.setTeamMembers([]);
            return;
          }

          this.setTeamMembers(result.data);
        },
        error: () => {
          this.loadingTeamData = false;
          this.setTeamMembers([]);
        }
      });
  }

  private isValidGuid(value: string | null | undefined): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private initCompanyAndTeam(companyId: string, sessionRole: string): void {
    if (sessionRole !== 'ADM_MASTER') {
      this.loadTeamData(companyId);
    } else {
      // ADM_MASTER: apenas busca o nome da empresa (não tem equipe própria)
      this.companiesApi.getById(companyId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ next: (r) => { if (r?.isSuccess && r.data) this.companyDisplayName = r.data.name || 'Empresa'; } });
    }
  }

  private isStep2Valid(): boolean {
    this.f['department']?.markAsTouched();
    this.f['projectType']?.markAsTouched();

    if (this.f['department']?.invalid || this.f['projectType']?.invalid) {
      return false;
    }

    // Sem usuários disponíveis: permite avançar sem membros na equipe
    if (!this.loadingTeamData && this.availableUsers.length === 0) {
      return true;
    }

    for (const member of this.teamMembersArray.controls) {
      member.markAllAsTouched();
    }

    this.teamMembersArray.updateValueAndValidity();

    return !this.teamMembersArray.errors;
  }

  private isStep3Valid(): boolean {
    if (this.f['budgetType']?.value === 'fixed' && !this.f['budgetValue']?.value) {
      this.f['budgetValue']?.markAsTouched();
      return false;
    }
    return true;
  }

  private saveStep3Details(): void {
    if (!this.createdProjectId) {
      this.isSubmitting = false;
      this.submitError = 'ID do projeto não encontrado. Volte ao início e tente novamente.';
      return;
    }

    const raw = this.form.getRawValue();
    const toIso = (v: string) => new Date(v).toISOString();

    const budgetMap: Record<string, number> = { unlimited: 0, fixed: 1, tbd: 2 };
    const workMap: Record<string, number> = { commercial: 0, flexible: 1, 'off-hours': 2 };
    const downtimeMap: Record<string, number> = { na: 0, limited: 1, zero: 2 };
    const complianceKeyMap: Record<string, number> = {
      publicData: 0, lgpd: 1, pciDss: 2, hipaa: 3, iso27001: 4, sox: 5
    };
    // complianceApprovers → SensitiveDataType: Juridico=0, SegurancaDaInformacao=1, DPO=2, Compliance=3
    const sensitiveDataKeyMap: Record<string, number> = {
      legal: 0, security: 1, dpo: 2, complianceTeam: 3
    };
    // integration status: 'exists' → 1 (Existe), 'to-create' → 2 (Criar)
    const integrationStatusMap: Record<string, number> = { exists: 1, 'to-create': 2 };

    const compliance = raw.compliance as Record<string, boolean>;
    const compliances = Object.entries(complianceKeyMap)
      .filter(([key]) => compliance[key])
      .map(([, value]) => ({ tipoCompliance: value }));

    const approvers = raw.complianceApprovers as Record<string, boolean>;
    const sensitiveData = Object.entries(sensitiveDataKeyMap)
      .filter(([key]) => approvers[key])
      .map(([, value]) => ({ tipoDadoSensivel: value }));

    const unavailablePeriods = (raw.unavailablePeriods as any[]).map((p: any) => ({
      dataInicio: toIso(p.startDate),
      dataFim: toIso(p.endDate),
      motivo: p.reason || undefined
    }));

    const dependencies = raw.hasExternalDependencies === 'yes'
      ? (raw.externalDependencies as any[]).map((d: any) => ({
          nome: d.name,
          descricao: d.whatIsNeeded,
          prazo: d.deadline ? toIso(d.deadline) : undefined,
          criticidade: d.criticality
        }))
      : [];

    const integrations = raw.hasIntegrations === 'yes'
      ? (raw.integrations as any[]).map((i: any) => ({
          nomeSistema: i.systemName,
          tipo: i.type,
          criticidade: i.criticality,
          status: integrationStatusMap[i.status] ?? 1
        }))
      : [];

    const budgetValue = raw.budgetType === 'fixed' && raw.budgetValue
      ? parseFloat(raw.budgetValue)
      : undefined;

    const downtimeHours = raw.downtimePolicy === 'limited' && raw.downtimeLimitHours
      ? parseFloat(raw.downtimeLimitHours)
      : undefined;

    const request: ProjectDetailsRequest = {
      projectId: this.createdProjectId,
      temDependenciasExternas: raw.hasExternalDependencies === 'yes',
      temIntegracoes: raw.hasIntegrations === 'yes',
      orcamento: budgetMap[raw.budgetType] ?? 0,
      valorOrcamento: budgetValue,
      horarioTrabalho: workMap[raw.workSchedule] ?? 0,
      downtimePermitido: downtimeMap[raw.downtimePolicy] ?? 0,
      horasDowntime: downtimeHours,
      compliances,
      unavailablePeriods,
      dependencies,
      integrations,
      sensitiveData
    };

    if (this.isEditMode && this.hasExistingDetails && this.existingDetailsId) {
      // Editing: use PUT (compliances and periods stay as saved in DB)
      const updateRequest: UpdateProjectDetailsRequest = {
        id: this.existingDetailsId,
        temDependenciasExternas: request.temDependenciasExternas,
        temIntegracoes: request.temIntegracoes,
        orcamento: request.orcamento,
        valorOrcamento: request.valorOrcamento,
        horarioTrabalho: request.horarioTrabalho,
        downtimePermitido: request.downtimePermitido,
        horasDowntime: request.horasDowntime,
        dependencies: request.dependencies,
        integrations: request.integrations,
        sensitiveData: request.sensitiveData
      };
      this.projectsApi.updateDetails(this.createdProjectId, updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.isSubmitting = false;
            if (result && !result.isSuccess) {
              this.submitError = result.message ?? 'Não foi possível atualizar os detalhes.';
              this.submitErrors = (result as any)?.errors ?? [];
              return;
            }
            this.clearDraft();
            this.currentStep += 1;
            this.formSubmitted = false;
          },
          error: () => {
            this.isSubmitting = false;
            this.submitError = 'Erro ao atualizar detalhes do projeto. Tente novamente.';
          }
        });
    } else {
      this.projectsApi.saveDetails(this.createdProjectId, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.isSubmitting = false;
            if (result && !result.isSuccess) {
              this.submitError = result.message ?? 'Não foi possível salvar os detalhes.';
              this.submitErrors = (result as any)?.errors ?? [];
              return;
            }
            this.hasExistingDetails = true;
            this.clearDraft();
            this.currentStep += 1;
            this.formSubmitted = false;
          },
          error: () => {
            this.isSubmitting = false;
            this.submitError = 'Erro ao salvar detalhes do projeto. Tente novamente.';
          }
        });
    }
  }

  private saveStep4ExecutionSettings(): void {
    if (!this.createdProjectId) {
      this.isSubmitting = false;
      this.submitError = 'ID do projeto não encontrado. Volte ao início e tente novamente.';
      return;
    }

    const raw = this.form.getRawValue();

    const experienceMap: Record<string, number> = { never: 1, similar: 2, exact: 3 };
    const detailMap: Record<string, number> = { macro: 1, balanced: 2, granular: 3 };
    const reviewMap: Record<string, number> = { weekly: 1, biweekly: 2, monthly: 3 };
    const priorityLabelMap: Record<string, number> = {
      'Prazo': 1, 'Qualidade': 2, 'Custo': 3, 'Escopo': 4, 'Documentação': 5
    };

    const request: ProjectExecutionSettingsRequest = {
      experienciaEquipe: experienceMap[raw.previousExperience] ?? 1,
      nivelDetalhePlano: detailMap[raw.detailLevel] ?? 2,
      frequenciaRevisao: reviewMap[raw.reviewFrequency] ?? 1,
      maiorRisco: raw.biggestRisk || undefined,
      observacoes: raw.finalObservations || undefined,
      oQueDeuCerto: raw.previousExperience === 'similar' ? raw.whatWentWell || undefined : undefined,
      oQueDeuErrado: raw.previousExperience === 'similar' ? raw.whatWentWrong || undefined : undefined,
      prioridadesOrdenadas: this.priorityItems.map((label, index) => ({
        priorityType: priorityLabelMap[label] ?? 1,
        posicao: index + 1
      }))
    };

    const apiCall = (this.isEditMode && this.hasExistingExecutionSettings)
      ? this.projectsApi.updateExecutionSettings(this.createdProjectId, request)
      : this.projectsApi.saveExecutionSettings(this.createdProjectId, request);

    apiCall
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;
          if (result && !result.isSuccess) {
            this.submitError = result.message ?? 'Não foi possível salvar as configurações de execução.';
            this.submitErrors = (result as any)?.errors ?? [];
            return;
          }
          this.hasExistingExecutionSettings = true;
          this.clearDraft();
          this.currentStep += 1;
          this.formSubmitted = false;
        },
        error: () => {
          this.isSubmitting = false;
          this.submitError = 'Erro ao salvar configurações de execução. Tente novamente.';
        }
      });
  }

  private updateProjectFromStep2(): void {
    const raw = this.form.getRawValue();
    const toIso = (v: string) => v ? new Date(v).toISOString() : null;

    this.projectsApi.update(this.editingProjectId!, {
      id: this.editingProjectId!,
      name: raw.name,
      objective: raw.objective || undefined,
      description: raw.description || undefined,
      status: 'Planejamento',
      startDate: toIso(raw.startDate),
      endDate: toIso(raw.endDate),
      responsibleSector: raw.department,
      projectType: raw.projectType
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (!result?.isSuccess) {
          this.isSubmitting = false;
          this.submitError = result?.message ?? 'Não foi possível atualizar o projeto.';
          this.submitErrors = (result as any)?.errors ?? [];
          return;
        }
        this.syncMembersAndAdvance(raw);
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Erro ao atualizar o projeto. Tente novamente.';
      }
    });
  }

  private syncMembersAndAdvance(raw: any): void {
    const projectId = this.editingProjectId!;

    const currentMembers = (raw.teamMembers as any[])
      .filter((m: any) => m.selected)
      .map((m: any) => ({
        userId: m.userId as string,
        role: m.role as string,
        dedication: m.dedication as string,
        isApprover: m.isApprover as boolean,
        roleDescription: m.roleDescription as string | undefined
      }));

    const currentUserIds = new Set(currentMembers.map(m => m.userId));

    const toDelete = [...this.existingMembersMap.entries()]
      .filter(([uid]) => !currentUserIds.has(uid))
      .map(([, memberId]) => this.projectsApi.removeMember(projectId, memberId));

    const toAdd = currentMembers
      .filter(m => !this.existingMembersMap.has(m.userId))
      .map(m => this.projectsApi.addMember(projectId, {
        userId: m.userId,
        projectFunction: m.role,
        dedication: m.dedication,
        approver: m.isApprover ? 'Sim' : 'Não',
        functionDescription: m.roleDescription || undefined
      }));

    const allObs = [...toDelete, ...toAdd];

    if (allObs.length === 0) {
      this.isSubmitting = false;
      this.clearDraft();
      this.currentStep += 1;
      this.formSubmitted = false;
      return;
    }

    forkJoin(allObs).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        this.isSubmitting = false;
        const failed = results.find(r => r && !r.isSuccess);
        if (failed) {
          this.submitError = (failed as any).message ?? 'Erro ao sincronizar membros.';
          return;
        }
        this.clearDraft();
        this.currentStep += 1;
        this.formSubmitted = false;
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Erro ao sincronizar membros do projeto. Tente novamente.';
      }
    });
  }

  private createProjectFromStep2(): void {
    const raw = this.form.getRawValue();
    const toIso = (v: string) => v ? new Date(v).toISOString() : null;

    const members: ProjectMemberRequest[] = (raw.teamMembers as any[])
      .filter((m: any) => m.selected)
      .map((m: any) => ({
        userId: m.userId,
        projectFunction: m.role,
        dedication: m.dedication,
        approver: m.isApprover ? 'Sim' : 'Não',
        functionDescription: m.roleDescription || undefined
      }));

    this.projectsApi.create({
      userId: this.CURRENT_USER_ID,
      name: raw.name,
      objective: raw.objective || undefined,
      description: raw.description || undefined,
      status: 'Planejamento',
      startDate: toIso(raw.startDate),
      endDate: toIso(raw.endDate),
      responsibleSector: raw.department,
      projectType: raw.projectType,
      members
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        if (!result?.isSuccess) {
          this.submitError = result?.message ?? 'Não foi possível criar o projeto.';
          this.submitErrors = (result as any)?.errors ?? [];
          return;
        }
        this.createdProjectId = result.data?.id;
        this.currentStep += 1;
        this.formSubmitted = false;
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Erro ao criar o projeto. Tente novamente.';
      }
    });
  }

  nextStep(): void {
    this.formSubmitted = true;
    if (this.currentStep === 1 && !this.isStep1Valid()) {
      return;
    }

    if (this.currentStep === 2) {
      if (!this.isStep2Valid()) return;
      this.submitError = undefined;
      this.submitErrors = [];
      this.isSubmitting = true;
      if (this.isEditMode) {
        this.updateProjectFromStep2();
      } else {
        this.createProjectFromStep2();
      }
      return;
    }

    if (this.currentStep === 3) {
      if (!this.isStep3Valid()) return;
      this.submitError = undefined;
      this.submitErrors = [];
      this.isSubmitting = true;
      this.saveStep3Details();
      return;
    }

    if (this.currentStep === 4) {
      this.submitError = undefined;
      this.submitErrors = [];
      this.isSubmitting = true;
      this.saveStep4ExecutionSettings();
      return;
    }

    this.currentStep += 1;
    this.formSubmitted = false;
  }

  previousStep(): void {
    this.currentStep -= 1;
    this.formSubmitted = false;
  }

  get nextButtonText(): string {
    return 'Próximo →';
  }

  get currentStepSubtitle(): string {
    if (this.isEditMode) return 'Atualize os dados do projeto';
    const subtitles: Record<number, string> = {
      1: 'Passo 1 de 5 · Dados do Projeto',
      2: 'Passo 2 de 5 · Equipe e Responsáveis',
      3: 'Passo 3 de 5 · Contexto Operacional',
      4: 'Passo 4 de 5 · Estratégia e Prioridades',
      5: 'Passo 5 de 5 · Revisão Final + IA'
    };
    return subtitles[this.currentStep] ?? '';
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      this.formSubmitted = false;
      return;
    }
    
    if (step > this.currentStep) {
      // Step 5 requires saving steps 2-4 first — only allow jumping to it if already there
      if (step === 5 && this.currentStep < 5) return;
      this.formSubmitted = true;
      if (this.currentStep === 1 && !this.isStep1Valid()) return;
      if (this.currentStep === 2 && !this.isStep2Valid()) return;
      if (this.currentStep === 3 && !this.isStep3Valid()) return;
      this.currentStep = step;
      this.formSubmitted = false;
    }
  }

  onConcluir(): void {
    this.isSubmitting = true;
    this.submitError = undefined;
    this.submitErrors = [];
    this.generationStep = 1;

    if (this.generationInterval) clearInterval(this.generationInterval);
    let step = 1;
    this.generationInterval = setInterval(() => {
      if (step < 3) { step++; this.generationStep = step; }
      else { clearInterval(this.generationInterval); }
    }, 2500);

    const raw = this.form.getRawValue();
    const selectedMembers = (raw.teamMembers as any[])
      .filter((m: any) => m.selected)
      .map((m: any) => ({
        userId: m.userId,
        userName: m.userName,
        role: m.role,
        dedication: m.dedication,
        isApprover: m.isApprover,
        roleDescription: m.roleDescription
      }));

    const compliance = raw.compliance;
    const selectedCompliance: string[] = [];
    if (compliance.publicData) selectedCompliance.push('Dados Públicos');
    if (compliance.lgpd) selectedCompliance.push('LGPD');
    if (compliance.pciDss) selectedCompliance.push('PCI-DSS');
    if (compliance.hipaa) selectedCompliance.push('HIPAA');
    if (compliance.iso27001) selectedCompliance.push('ISO 27001');
    if (compliance.sox) selectedCompliance.push('SOX');

    const approvers = raw.complianceApprovers;
    const selectedApprovers: string[] = [];
    if (approvers.legal) selectedApprovers.push('Jurídico');
    if (approvers.security) selectedApprovers.push('Segurança da Informação');
    if (approvers.dpo) selectedApprovers.push('DPO');
    if (approvers.complianceTeam) selectedApprovers.push('Compliance');

    // Montar bloco de documentos + contexto adicional do step 5
    let additionalContext = raw.finalObservations || '';

    if (this.uploadedFiles.length > 0 || this.additionalContext?.trim()) {
      let documentBlock = '=== DOCUMENTOS E CONTEXTO ADICIONAL ===';

      if (this.uploadedFiles.length > 0) {
        const filesContext = this.uploadedFiles
          .map(file => `\n\n--- Conteúdo de ${file.fileName} ---\n${file.extractedText}`)
          .join('\n');
        documentBlock += filesContext;
      }

      if (this.additionalContext?.trim()) {
        documentBlock += `\n\n--- Contexto adicional informado pelo usuário ---\n${this.additionalContext.trim()}`;
      }

      additionalContext = additionalContext
        ? `${additionalContext}\n\n${documentBlock}`
        : documentBlock;
    }

    const payload: ProjectAnalysisRequest = {
      projectId: this.createdProjectId,
      projectName: raw.name,
      objective: raw.objective,
      startDate: raw.startDate,
      endDate: raw.endDate || undefined,
      description: raw.description || undefined,
      company: this.companyDisplayName,
      department: raw.department,
      projectType: raw.projectType,
      teamMembers: selectedMembers,
      hasExternalDependencies: raw.hasExternalDependencies,
      externalDependencies: raw.hasExternalDependencies === 'yes' ? raw.externalDependencies : [],
      budgetType: raw.budgetType,
      budgetValue: raw.budgetType === 'fixed' && raw.budgetValue != null ? String(raw.budgetValue) : undefined,
      workSchedule: raw.workSchedule,
      downtimePolicy: raw.downtimePolicy,
      downtimeLimitHours: raw.downtimePolicy === 'limited' && raw.downtimeLimitHours != null ? String(raw.downtimeLimitHours) : undefined,
      hasIntegrations: raw.hasIntegrations,
      integrations: raw.hasIntegrations === 'yes' ? raw.integrations : [],
      compliance: selectedCompliance,
      complianceApprovers: selectedApprovers,
      unavailablePeriods: raw.unavailablePeriods,
      priorityRanking: this.priorityItems,
      biggestRisk: raw.biggestRisk || undefined,
      previousExperience: raw.previousExperience,
      whatWentWell: raw.previousExperience === 'similar' ? raw.whatWentWell : undefined,
      whatWentWrong: raw.previousExperience === 'similar' ? raw.whatWentWrong : undefined,
      detailLevel: raw.detailLevel,
      reviewFrequency: raw.reviewFrequency,
      finalObservations: additionalContext || undefined
    };

    this.claudeApi.analyzeProject(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.isSuccess && res.data?.jobId) {
            this.pollAnalyzeStatus(res.data.jobId);
          } else {
            if (this.generationInterval) clearInterval(this.generationInterval);
            this.generationStep = 0;
            this.isSubmitting = false;
            this.finishProjectCreation();
          }
        },
        error: () => {
          if (this.generationInterval) clearInterval(this.generationInterval);
          this.generationStep = 0;
          this.isSubmitting = false;
          this.finishProjectCreation();
        }
      });
  }

  private pollAnalyzeStatus(jobId: string): void {
    interval(3000)
      .pipe(
        startWith(0),
        switchMap(() => this.claudeApi.pollAnalyzeProjectStatus(jobId)),
        takeWhile(
          (r) => r?.data?.status === 'Pending' || r?.data?.status === 'Running',
          true
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (r) => {
          const status = r?.data?.status as AnalyzeProjectJobStatus['status'] | undefined;
          if (status === 'Completed') {
            if (this.generationInterval) clearInterval(this.generationInterval);
            this.generationStep = 4;
            this.isSubmitting = false;
            if (r.data?.result) {
              this.analysisResult = r.data.result;
              this.showRecommendations = true;
            } else {
              this.finishProjectCreation();
            }
          } else if (status === 'Failed') {
            if (this.generationInterval) clearInterval(this.generationInterval);
            this.generationStep = 0;
            this.isSubmitting = false;
            this.finishProjectCreation();
          }
        },
        error: () => {
          if (this.generationInterval) clearInterval(this.generationInterval);
          this.generationStep = 0;
          this.isSubmitting = false;
          this.finishProjectCreation();
        }
      });
  }

  private startTaskMessages(): void {
    this.currentTaskMessage = this.taskMessages[0];
    let idx = 1;
    this.taskMessageInterval = setInterval(() => {
      this.currentTaskMessage = this.taskMessages[idx % this.taskMessages.length];
      idx++;
    }, 4000);
  }

  private stopTaskMessages(): void {
    if (this.taskMessageInterval) {
      clearInterval(this.taskMessageInterval);
      this.taskMessageInterval = undefined;
    }
  }

  onGenerateTasks(): void {
    if (!this.createdProjectId) return;
    if (this.taskReviewPhase > 0 || this.isGeneratingTasks) return;
    this.isGeneratingTasks = true;
    this.generateTasksError = undefined;
    this.startTaskMessages();

    this.claudeApi.generateTasks(this.createdProjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.isSuccess && res.data?.jobId) {
            this.pollJobStatus(res.data.jobId);
          } else {
            this.stopTaskMessages();
            this.isGeneratingTasks = false;
            this.generateTasksError = res?.message ?? 'Erro ao iniciar geração de tarefas.';
          }
        },
        error: () => {
          this.stopTaskMessages();
          this.isGeneratingTasks = false;
          this.generateTasksError = 'Erro ao iniciar geração de tarefas.';
        }
      });
  }

  private pollJobStatus(jobId: string): void {
    interval(3000)
      .pipe(
        startWith(0),
        switchMap(() => this.claudeApi.pollGenerateTasksStatus(jobId)),
        takeWhile(
          (r) => r?.data?.status === 'Pending' || r?.data?.status === 'Running',
          true /* inclusive — emite o valor que quebrou a condição */
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (r) => {
          const status = r?.data?.status as GenerateTasksJobStatus['status'] | undefined;
          if (status === 'Completed') {
            this.stopTaskMessages();
            this.isGeneratingTasks = false;
            this.loadGeneratedTasks();
          } else if (status === 'Failed') {
            this.stopTaskMessages();
            this.isGeneratingTasks = false;
            this.generateTasksError = r?.data?.errorMessage ?? 'Erro ao gerar tarefas. Tente novamente.';
          }
        },
        error: () => {
          this.stopTaskMessages();
          this.isGeneratingTasks = false;
          this.generateTasksError = 'Erro ao verificar status da geração. Tente novamente.';
        }
      });
  }

  resetAnalysis(): void {
    this.analysisResult = undefined;
    this.isSubmitting = false;
    this.generationStep = 0;
    this.taskReviewPhase = 0;
    this.generatedMacroTasks = [];
    this.loadingGeneratedTasks = false;
    this.isDeletingTask.clear();
    this.stopTaskMessages();
  }

  // ── Task Review Phase 1: load generated tasks ────────────────────────────
  private loadGeneratedTasks(): void {
    if (!this.createdProjectId) { this.navigateToBoard(); return; }
    this.loadingGeneratedTasks = true;

    this.boardApi.getByProject(this.createdProjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.loadingGeneratedTasks = false;
          if (!result?.isSuccess || !Array.isArray(result.data)) {
            this.navigateToBoard();
            return;
          }
          this.generatedMacroTasks = result.data
            .filter(t => !t.parentTaskId)
            .sort((a, b) => a.ordemNoBoard - b.ordemNoBoard);
          this.taskReviewPhase = 1;
        },
        error: () => {
          this.loadingGeneratedTasks = false;
          this.navigateToBoard();
        }
      });
  }

  deleteMacroTask(task: BoardTaskDto): void {
    if (this.isDeletingTask.has(task.id)) return;
    this.isDeletingTask.add(task.id);

    const subIds = (task.subTasks ?? []).map(s => s.id);
    const allIds = [task.id, ...subIds];
    const deletes = allIds.map(id => this.boardApi.delete(id));

    forkJoin(deletes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.generatedMacroTasks = this.generatedMacroTasks.filter(t => t.id !== task.id);
          this.isDeletingTask.delete(task.id);
        },
        error: () => { this.isDeletingTask.delete(task.id); }
      });
  }

  proceedToSubtasks(): void { this.taskReviewPhase = 2; }
  backToMacros(): void { this.taskReviewPhase = 1; }

  getMacroSubtasks(task: BoardTaskDto): BoardTaskDto[] {
    return (task.subTasks ?? []).sort((a, b) => a.ordemNoBoard - b.ordemNoBoard);
  }

  get totalSubtasksCount(): number {
    return this.generatedMacroTasks.reduce((acc, t) => acc + (t.subTasks?.length ?? 0), 0);
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      'Crítica': 'priority-critica', 'Alta': 'priority-alta',
      'Média': 'priority-media', 'Baixa': 'priority-baixa'
    };
    return map[priority] ?? 'priority-media';
  }

  getPriorityEmoji(priority: string): string {
    const map: Record<string, string> = { 'Crítica': '🔴', 'Alta': '🟠', 'Média': '🟡', 'Baixa': '🟢' };
    return map[priority] ?? '🟡';
  }

  navigateToBoard(): void {
    this.authSession.clearOnboardingFlag();
    this.router.navigate(['/projects', this.createdProjectId, 'board']);
  }

  private finishProjectCreation(): void {
    // Project was already created when advancing from step 2
    if (this.createdProjectId && !this.isEditMode) {
      this.isSubmitting = false;
      if (!this.analysisResult) {
        this.submitSuccess = 'Projeto criado com sucesso!';
        setTimeout(() => this.router.navigate(['/projects']), 1500);
      }
      return;
    }

    const raw = this.form.getRawValue();
    const toIso = (v: string) => v ? new Date(v).toISOString() : null;

    const request$ = this.isEditMode
      ? this.projectsApi.update(this.editingProjectId!, {
          id: this.editingProjectId!,
          name: raw.name,
          description: raw.description || undefined,
          objective: raw.objective || undefined,
          startDate: toIso(raw.startDate),
          endDate: toIso(raw.endDate)
        })
      : this.projectsApi.create({
          userId: this.CURRENT_USER_ID,
          name: raw.name,
          description: raw.description || undefined,
          objective: raw.objective || undefined,
          startDate: toIso(raw.startDate),
          endDate: toIso(raw.endDate)
        });

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        if (!result?.isSuccess) {
          this.submitError = result?.message ?? 'Não foi possível salvar o projeto.';
          this.submitErrors = (result as any)?.errors ?? [];
          return;
        }
        if (!this.analysisResult) {
          this.submitSuccess = this.isEditMode ? 'Projeto atualizado com sucesso!' : 'Projeto criado com sucesso!';
          setTimeout(() => this.router.navigate(['/projects']), 1500);
        }
        // If analysisResult is set, user navigates via the 'Ver projetos' button
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Erro inesperado ao salvar o projeto.';
      }
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.submitError = undefined;
    this.submitErrors = [];
    this.submitSuccess = undefined;

    const { name, description, objective, startDate, endDate } = this.form.getRawValue();
    const toIso = (v: string) => v ? new Date(v).toISOString() : null;

    const request$ = this.isEditMode
      ? this.projectsApi.update(this.editingProjectId!, {
          id: this.editingProjectId!,
          name,
          description: description || undefined,
          objective: objective || undefined,
          startDate: toIso(startDate),
          endDate: toIso(endDate)
        })
      : this.projectsApi.create({
          userId: this.CURRENT_USER_ID,
          name,
          description: description || undefined,
          objective: objective || undefined,
          startDate: toIso(startDate),
          endDate: toIso(endDate)
        });

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        if (!result?.isSuccess) {
          this.submitError = result?.message ?? 'Não foi possível salvar o projeto.';
          this.submitErrors = (result as any)?.errors ?? [];
          return;
        }
        this.submitSuccess = this.isEditMode ? 'Projeto atualizado com sucesso!' : 'Projeto criado com sucesso!';
        if (!this.isEditMode) {
          this.form.reset({ name: '', description: '', objective: '', startDate: '', endDate: '' });
          this.formSubmitted = false;
        }
        setTimeout(() => this.router.navigate(['/projects']), 1200);
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Erro inesperado ao salvar o projeto.';
      }
    });
  }

  // ── File upload management ──────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Reset input para permitir selecionar o mesmo arquivo novamente
    input.value = '';

    // Validar tamanho
    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      this.fileUploadError = `Arquivo muito grande (${this.formatFileSize(file.size)}). O limite é ${this.MAX_FILE_SIZE_MB}MB.`;
      return;
    }

    // Validar tipo
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      this.fileUploadError = `Formato "${fileExtension}" não suportado. Use: PDF, Word, Excel ou TXT.`;
      return;
    }

    this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    this.isUploadingFile = true;
    this.uploadStage = 'uploading';
    this.fileUploadError = undefined;

    // Transition to processing stage after brief delay to signal upload completed
    const processingTimer = setTimeout(() => {
      if (this.isUploadingFile) this.uploadStage = 'processing';
    }, 600);

    this.documentsApi.extractText(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          clearTimeout(processingTimer);
          this.isUploadingFile = false;
          if (!result?.isSuccess || !result.data) {
            this.uploadStage = 'idle';
            this.fileUploadError = result?.message ?? 'Erro ao processar o arquivo. Verifique se o arquivo não está corrompido.';
            return;
          }
          this.uploadedFiles.push(result.data);
          this.uploadStage = 'done';
          this.fileUploadError = undefined;
          // Reset stage after brief success feedback
          setTimeout(() => { this.uploadStage = 'idle'; }, 2000);
        },
        error: () => {
          clearTimeout(processingTimer);
          this.isUploadingFile = false;
          this.uploadStage = 'idle';
          this.fileUploadError = 'Não foi possível enviar o arquivo. Verifique sua conexão e tente novamente.';
        }
      });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isUploadingFile) this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    if (this.isUploadingFile) return;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    this.fileUploadError = undefined;

    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      this.fileUploadError = `Arquivo muito grande (${this.formatFileSize(file.size)}). O limite é ${this.MAX_FILE_SIZE_MB}MB.`;
      return;
    }

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      this.fileUploadError = `Formato "${ext}" não suportado. Use: PDF, Word, Excel ou TXT.`;
      return;
    }

    this.uploadFile(file);
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const icons: Record<string, string> = {
      '.pdf': 'ft-file-text',
      '.doc': 'ft-file',
      '.docx': 'ft-file',
      '.xls': 'ft-grid',
      '.xlsx': 'ft-grid',
      '.txt': 'ft-align-left'
    };
    return icons[ext] ?? 'ft-file';
  }

  getFileTypeName(fileName: string): string {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const types: Record<string, string> = {
      '.pdf': 'PDF',
      '.doc': 'Word',
      '.docx': 'Word',
      '.xls': 'Excel',
      '.xlsx': 'Excel',
      '.txt': 'Texto'
    };
    return types[ext] ?? ext.replace('.', '').toUpperCase();
  }

  removeUploadedFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
