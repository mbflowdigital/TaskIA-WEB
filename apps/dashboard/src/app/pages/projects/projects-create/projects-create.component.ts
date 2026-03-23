import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, UntypedFormArray, UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ProjectsApiService } from '../../../shared/api/projects-api.service';
import { CompaniesApiService } from '../../../shared/api/companies-api.service';
import { UserDto } from '../../../shared/api/users/users.types';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ClaudeApiService, ProjectAnalysisRequest, ProjectAnalysisResult } from '../../../shared/api/claude-api.service';

@Component({
  selector: 'app-projects-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DragDropModule],
  templateUrl: './projects-create.component.html',
  styleUrls: ['./projects-create.component.scss']
})
export class ProjectsCreateComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly leadershipRoles = ['Gerente de Projeto', 'Tech Lead'];

  // Wizard
  currentStep = 1;
  readonly totalSteps = 4;

  companyDisplayName = 'Empresa';
  availableUsers: UserDto[] = [];
  loadingTeamData = false;

  isEditMode = false;
  editingProjectId?: string;
  isLoading = false;
  loadError?: string;

  isSubmitting = false;
  submitError?: string;
  submitErrors: string[] = [];
  submitSuccess?: string;
  analysisResult?: ProjectAnalysisResult;

  formSubmitted = false;

  priorityItems: string[] = ['Prazo', 'Qualidade', 'Custo', 'Escopo', 'Documentação'];

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
    name: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(200)
    ]),
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

  readonly departmentOptions = ['TI', 'Marketing', 'RH', 'Operações', 'Financeiro', 'Produto', 'Comercial'];
  readonly projectTypeOptions = ['Migração', 'Implantação', 'Melhoria', 'Desenvolvimento', 'Integração'];
  readonly roleOptions = [
    'Gerente de Projeto',
    'Tech Lead',
    'Desenvolvedor',
    'Analista',
    'Designer',
    'QA',
    'DevOps'
  ];
  readonly dedicationOptions = ['Integral', 'Parcial 50%', 'Parcial 25%', 'Consultor Pontual'];

  constructor(
    private readonly projectsApi: ProjectsApiService,
    private readonly companiesApi: CompaniesApiService,
    private readonly authSession: AuthSessionService,
    private readonly claudeApi: ClaudeApiService,
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

    this.companyDisplayName = sessionUser?.companyName ?? 'Empresa';
    if (sessionRole !== 'ADM_MASTER' && this.isValidGuid(companyId)) {
      this.loadTeamData(companyId);
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
    this.isLoading = true;

    this.projectsApi
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (!result?.isSuccess || !result.data) {
            this.loadError = result?.message ?? 'Não foi possível carregar o projeto.';
            return;
          }
          this.form.patchValue({
            name: result.data.name,
            description: result.data.description ?? '',
            objective: result.data.objective ?? '',
            startDate: result.data.startDate ? result.data.startDate.substring(0, 10) : '',
            endDate: result.data.endDate ? result.data.endDate.substring(0, 10) : ''
          });
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
      roleDescription: new UntypedFormControl('')
    });
  }

  private setTeamMembers(users: UserDto[]): void {
    this.availableUsers = users;
    this.teamMembersArray.clear();
    this.teamMembersArray.updateValueAndValidity();
  }

  get unselectedUsers(): UserDto[] {
    const selectedIds = new Set(this.teamMembersArray.controls.map(c => c.get('userId')?.value));
    return this.availableUsers.filter(u => !selectedIds.has(u.id));
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
      criticality: new UntypedFormControl('', Validators.required)
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
      status: new UntypedFormControl('exists')
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
  }

  private loadTeamData(companyId: string): void {
    this.loadingTeamData = true;

    this.companiesApi
      .getById(companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.isSuccess && result.data?.name) {
            this.companyDisplayName = result.data.name;
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

  private isStep2Valid(): boolean {
    this.f['department']?.markAsTouched();
    this.f['projectType']?.markAsTouched();

    for (const member of this.teamMembersArray.controls) {
      member.markAllAsTouched();
    }

    this.teamMembersArray.updateValueAndValidity();

    if (this.f['department']?.invalid || this.f['projectType']?.invalid) {
      return false;
    }

    return !this.teamMembersArray.errors;
  }

  private isStep3Valid(): boolean {
    if (this.f['budgetType']?.value === 'fixed' && !this.f['budgetValue']?.value) {
      this.f['budgetValue']?.markAsTouched();
      return false;
    }
    return true;
  }

  nextStep(): void {
    // Ao avançar da tela 1, validar campos
    this.formSubmitted = true;
    if (this.currentStep === 1 && !this.isStep1Valid()) {
      return; // Não avança
    }

    if (this.currentStep === 2 && !this.isStep2Valid()) {
      return;
    }

    if (this.currentStep === 3 && !this.isStep3Valid()) {
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
    if (this.currentStep === 4) return 'Passo 4 de 4: Prioridades e expectativas';
    if (this.currentStep === 3) return 'Passo 3 de 4: Contexto e restrições';
    if (this.currentStep === 2) return 'Passo 2 de 4: Equipe e funções';
    return 'Passo 1 de 4: Dados básicos';
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      this.formSubmitted = false;
      return;
    }
    
    if (step > this.currentStep) {
      this.formSubmitted = true;
      if (this.currentStep === 1 && !this.isStep1Valid()) return;
      if (this.currentStep === 2 && !this.isStep2Valid()) return;
      if (this.currentStep === 3 && !this.isStep3Valid()) return;
      this.currentStep = step;
      this.formSubmitted = false;
    }
  }

  onConcluir(): void {
    this.formSubmitted = true;
    if (!this.isStep3Valid()) return;

    this.isSubmitting = true;
    this.submitError = undefined;
    this.submitErrors = [];

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

    const payload: ProjectAnalysisRequest = {
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
      budgetValue: raw.budgetType === 'fixed' ? raw.budgetValue : undefined,
      workSchedule: raw.workSchedule,
      downtimePolicy: raw.downtimePolicy,
      downtimeLimitHours: raw.downtimePolicy === 'limited' ? raw.downtimeLimitHours : undefined,
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
      finalObservations: raw.finalObservations || undefined
    };

    this.claudeApi.analyzeProject(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.isSuccess && result.data) {
            this.analysisResult = result.data;
          }
          this.finishProjectCreation();
        },
        error: () => {
          this.finishProjectCreation();
        }
      });
  }

  private finishProjectCreation(): void {
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
}
