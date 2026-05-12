import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CompaniesApiService, CompanyDto } from '../../../shared/api/companies-api.service';
import { PositionsApiService } from '../../../shared/api/positions-api.service';
import { UsersApiService } from '../../../shared/api/users-api.service';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';
import { PositionDto } from 'app/shared/api/positions/positions.types';

function applyMaskCpf(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1-$2');
}

@Component({
  selector: 'app-users-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './users-create.component.html',
  styleUrls: ['./users-create.component.scss']
})
export class UsersCreateComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isEditMode = false;
  editingUserId?: string;
  isLoading = false;
  loadError?: string;
  referenceError?: string;

  isSubmitting = false;
  submitError?: string;
  submitErrors: string[] = [];
  submitSuccess?: string;

  formSubmitted = false;
  isAdmMaster = false;
  admCompanyId?: string;
  admCompanyName?: string;
  companiesLoading = false;
  positionsLoading = false;

  companies: CompanyDto[] = [];
  positions: PositionDto[] = [];

  // ── Custom Dropdowns Control ────────────────────────────────────────────
  companyDropdownOpen = false;
  companySearchTerm = '';
  positionDropdownOpen = false;
  positionSearchTerm = '';
  roleDropdownOpen = false;
  roleSearchTerm = '';
  readonly roleOptions = ['USER', 'ADM'];

  form = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    cpf: new UntypedFormControl('', [Validators.required]),
    phone: new UntypedFormControl(''),
    birthDate: new UntypedFormControl('', [Validators.required]),
    role: new UntypedFormControl('USER'),
    companyId: new UntypedFormControl(''),
    positionId: new UntypedFormControl('')
  });

  constructor(
    private readonly usersApi: UsersApiService,
    private readonly companiesApi: CompaniesApiService,
    private readonly positionsApi: PositionsApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authSession: AuthSessionService
  ) {}

  ngOnInit(): void {
    const role = this.authSession.getRole().trim().toUpperCase();
    const isAdmin = role === 'ADM' || role === 'ADM_MASTER';
    this.isAdmMaster = role === 'ADM_MASTER';

    if (!isAdmin) {
      this.router.navigate(['/page']);
      return;
    }

    if (!this.isAdmMaster) {
      const sessionUser = this.authSession.getUser();
      this.admCompanyId = sessionUser?.companyId ?? undefined;
      this.admCompanyName = sessionUser?.companyName ?? undefined;
    }

    this.loadReferenceData();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEditMode = true;
    this.editingUserId = id;

    // Email não é editável pelo endpoint atual.
    this.form.controls['email'].disable();

    this.isLoading = true;
    this.loadError = undefined;

    this.usersApi
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;

          if (!result?.isSuccess || !result.data) {
            this.loadError = result?.message ?? 'Não foi possível carregar o usuário.';
            return;
          }

          const isoMin = '0001-01-01';
          const rawBirth = result.data.birthDate ?? '';
          const birthVal = rawBirth && !rawBirth.startsWith(isoMin)
            ? rawBirth.substring(0, 10)
            : '';

          this.form.patchValue({
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone ?? '',
            cpf: result.data.cpf ?? '',
            birthDate: birthVal,
            companyId: result.data.companyId ?? '',
            positionId: result.data.positionId ?? ''
          }, { emitEvent: false });
        },
        error: (err: unknown) => {
          this.isLoading = false;
          this.loadError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao carregar o usuário.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() {
    return this.form.controls;
  }

  private loadReferenceData(): void {
    this.positionsLoading = true;
    this.referenceError = undefined;

    this.positionsApi
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.positionsLoading = false;

          if (!result?.isSuccess || !result.data) {
            this.positions = [];
            this.referenceError = result?.message ?? 'Não foi possível carregar os cargos.';
            return;
          }

          this.positions = result.data;
        },
        error: (err: unknown) => {
          this.positionsLoading = false;
          this.positions = [];
          this.referenceError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao carregar os cargos.';
        }
      });

    if (!this.isAdmMaster) {
      return;
    }

    this.companiesLoading = true;
    this.companiesApi
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.companiesLoading = false;

          if (!result?.isSuccess || !result.data) {
            this.companies = [];
            this.referenceError = result?.message ?? 'Não foi possível carregar as empresas.';
            return;
          }

          this.companies = result.data;
        },
        error: (err: unknown) => {
          this.companiesLoading = false;
          this.companies = [];
          this.referenceError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao carregar as empresas.';
        }
      });
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.submitError = undefined;
    this.submitErrors = [];
    this.submitSuccess = undefined;

    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    const name = String(this.form.getRawValue().name ?? '').trim();
    const phone = String(this.form.getRawValue().phone ?? '').trim() || undefined;
    const cpf = String(this.form.getRawValue().cpf ?? '').trim();
    const birthDateRaw = String(this.form.getRawValue().birthDate ?? '').trim();
    // For non-ADM_MASTER: always use the ADM's own company from session
    const companyId = this.isAdmMaster
      ? (String(this.form.getRawValue().companyId ?? '').trim() || undefined)
      : this.admCompanyId;
    
    const positionIdRaw = this.form.getRawValue().positionId;
    const positionId = positionIdRaw ? Number(positionIdRaw) : undefined;
    
    // Send date as-is (yyyy-MM-dd) to avoid UTC timezone shifting
    const birthDate = birthDateRaw ? `${birthDateRaw}T00:00:00` : null;

    const role = String(this.form.getRawValue().role ?? 'USER').trim() || 'USER';

    // companyId é opcional — backend resolve empresa conforme perfil do ator e do novo usuário

    if (this.isEditMode) {
      const id = this.editingUserId;
      if (!id) {
        this.isSubmitting = false;
        this.submitError = 'Id do usuário não encontrado.';
        return;
      }

      this.usersApi
        .update(id, { id, name, phone, cpf, birthDate, companyId, positionId })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.isSubmitting = false;

            if (!result?.isSuccess) {
              this.submitError = result?.message ?? 'Não foi possível atualizar o usuário';
              this.submitErrors = result?.errors ?? [];
              return;
            }

            this.submitSuccess = result?.message ?? 'Usuário atualizado com sucesso';
            this.router.navigate(['/users']);
          },
          error: (err: unknown) => {
            this.isSubmitting = false;
            this.submitError =
              typeof err === 'object' && err && 'message' in err
                ? String((err as { message?: unknown }).message)
                : 'Erro inesperado ao atualizar o usuário';
          }
        });

      return;
    }

    const email = String(this.form.getRawValue().email ?? '').trim();

    this.usersApi
      .create({ name, email, phone, cpf, birthDate, role, companyId, positionId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;

          if (!result?.isSuccess) {
            this.submitError = result?.message ?? 'Não foi possível criar o usuário';
            this.submitErrors = result?.errors ?? [];
            return;
          }

          this.submitSuccess = result?.message ?? 'Usuário criado com sucesso';

          // Volta para a listagem; mantém o UX simples.
          this.router.navigate(['/users']);
        },
        error: (err: unknown) => {
          this.isSubmitting = false;
          this.submitError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao criar o usuário';
        }
      });
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = applyMaskCpf(input.value);
    input.value = masked;
    this.form.controls['cpf'].setValue(masked, { emitEvent: false });
  }

  onReset(): void {
    this.formSubmitted = false;
    this.submitError = undefined;
    this.submitErrors = [];
    this.submitSuccess = undefined;
    this.loadError = undefined;
    this.form.reset({ name: '', email: '', phone: '', cpf: '', birthDate: '', role: 'USER', companyId: '', positionId: '' });

    if (this.isEditMode) {
      this.form.controls['email'].disable();
    }
  }

  // ── Custom Dropdown Methods ─────────────────────────────────────────────

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.companyDropdownOpen = false;
    this.positionDropdownOpen = false;
    this.roleDropdownOpen = false;
  }

  // Company Dropdown
  toggleCompanyDropdown(event: Event): void {
    event.stopPropagation();
    this.companyDropdownOpen = !this.companyDropdownOpen;
    if (!this.companyDropdownOpen) {
      this.companySearchTerm = '';
    }
  }

  selectCompany(companyId: string): void {
    this.form.patchValue({ companyId });
    this.companyDropdownOpen = false;
    this.companySearchTerm = '';
  }

  updateCompanySearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.companySearchTerm = input.value;
  }

  getFilteredCompanies(): CompanyDto[] {
    if (!this.companySearchTerm || this.companySearchTerm.trim() === '') {
      return this.companies;
    }
    const term = this.companySearchTerm.toLowerCase();
    return this.companies.filter(company => company.name.toLowerCase().includes(term));
  }

  getSelectedCompanyName(): string {
    const selectedId = this.f.companyId.value;
    if (!selectedId) return 'Selecione uma empresa';
    const company = this.companies.find(c => c.id === selectedId);
    return company?.name || 'Selecione uma empresa';
  }

  // Position Dropdown
  togglePositionDropdown(event: Event): void {
    event.stopPropagation();
    this.positionDropdownOpen = !this.positionDropdownOpen;
    if (!this.positionDropdownOpen) {
      this.positionSearchTerm = '';
    }
  }

  selectPosition(positionId: string): void {
    this.form.patchValue({ positionId });
    this.positionDropdownOpen = false;
    this.positionSearchTerm = '';
  }

  updatePositionSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.positionSearchTerm = input.value;
  }

  getFilteredPositions(): PositionDto[] {
    if (!this.positionSearchTerm || this.positionSearchTerm.trim() === '') {
      return this.positions;
    }
    const term = this.positionSearchTerm.toLowerCase();
    return this.positions.filter(pos => pos.positionName.toLowerCase().includes(term));
  }

  getSelectedPositionName(): string {
    const selectedId = this.f.positionId.value;
    if (!selectedId) return 'Selecione um cargo';
    const position = this.positions.find(p => p.id === Number(selectedId));
    return position?.positionName || 'Selecione um cargo';
  }

  // Role Dropdown
  toggleRoleDropdown(event: Event): void {
    event.stopPropagation();
    this.roleDropdownOpen = !this.roleDropdownOpen;
    if (!this.roleDropdownOpen) {
      this.roleSearchTerm = '';
    }
  }

  selectRole(role: string): void {
    this.form.patchValue({ role });
    this.roleDropdownOpen = false;
    this.roleSearchTerm = '';
  }

  updateRoleSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.roleSearchTerm = input.value;
  }

  getFilteredRoles(): string[] {
    if (!this.roleSearchTerm || this.roleSearchTerm.trim() === '') {
      return this.isAdmMaster ? this.roleOptions : ['USER'];
    }
    const term = this.roleSearchTerm.toLowerCase();
    const roles = this.isAdmMaster ? this.roleOptions : ['USER'];
    return roles.filter(role => role.toLowerCase().includes(term));
  }

  getSelectedRoleName(): string {
    const selected = this.f.role.value;
    if (selected === 'ADM') return 'Administrador (ADM)';
    return 'Usuário';
  }
}
