import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthSessionService } from 'app/shared/auth/auth-session.service';
import { CompanyOnboardingData, OnboardingService } from 'app/shared/onboarding/onboarding.service';
import { CompaniesApiService } from 'app/shared/api/companies-api.service';
import { PositionsApiService } from 'app/shared/api/positions-api.service';
import { PositionDto } from 'app/shared/api/positions/positions.types';
import { UsersApiService } from 'app/shared/api/users-api.service';

function applyMaskCpf(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1-$2');
}

@Component({
  selector: 'app-company-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './company-onboarding.component.html',
  styleUrls: ['./company-onboarding.component.scss']
})
export class CompanyOnboardingComponent implements OnInit {
  isSubmitting = false;
  submitError?: string;

  formSubmitted = false;

  step: 'company' | 'employee' = 'company';
  companyData: CompanyOnboardingData | null = null;

  isEmployeeSubmitting = false;
  employeeFormSubmitted = false;
  employeeSubmitError?: string;
  isLookingUpCep = false;
  cepError?: string;
  positionsLoading = false;
  positions: PositionDto[] = [];

  form = new UntypedFormGroup({
    companyName: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    cnpj: new UntypedFormControl('', [Validators.required, Validators.pattern(/^([0-9]{14}|[0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\/?[0-9]{4}\-?[0-9]{2})$/)]),
    department: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    employeeCount: new UntypedFormControl('', [Validators.required]),

    addressZip: new UntypedFormControl('', [Validators.required, Validators.minLength(8)]),
    addressStreet: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    addressNumber: new UntypedFormControl('', [Validators.required]),
    addressComplement: new UntypedFormControl(''),
    addressNeighborhood: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    addressCity: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    addressState: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    addressCountry: new UntypedFormControl('Brasil', [Validators.required, Validators.minLength(2)])
  });

  employeeForm = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    cpf: new UntypedFormControl(''),
    phone: new UntypedFormControl(''),
    birthDate: new UntypedFormControl(''),
    positionId: new UntypedFormControl('', [Validators.required])
  });

  constructor(
    private readonly authSession: AuthSessionService,
    private readonly onboarding: OnboardingService,
    private readonly router: Router,
    private readonly companiesApi: CompaniesApiService,
    private readonly positionsApi: PositionsApiService,
    private readonly usersApi: UsersApiService
  ) {}

  ngOnInit(): void {
    const user = this.authSession.getUser();
    if (!user) {
      this.router.navigate(['/pages/login']);
      return;
    }

    // Segurança extra: se não for admin (mock) não mostra onboarding.
    if (!this.onboarding.isAdminMock(user)) {
      this.router.navigate(['/page']);
      return;
    }

    const userId = user.userId;
  this.loadPositions();

    // Se já completou empresa, pode ser que esteja pendente o passo do funcionário.
    if (this.onboarding.isCompanyOnboardingCompleted(userId)) {
      if (this.onboarding.isEmployeeOnboardingPending(userId)) {
        this.step = 'employee';
        this.companyData = this.onboarding.getCompanyOnboardingData(userId);
        this.prefillEmployeeFormFromSession();
        return;
      }

      this.router.navigate(['/page']);
      return;
    }

    this.step = 'company';
  }


  get f() {
    return this.form.controls;
  }

  get ef() {
    return this.employeeForm.controls;
  }

  private setAddressLookupState(isBusy: boolean): void {
    const controls = [
      'addressZip',
      'addressStreet',
      'addressNumber',
      'addressComplement',
      'addressNeighborhood',
      'addressCity',
      'addressState',
      'addressCountry'
    ];

    for (const controlName of controls) {
      const control = this.form.get(controlName);
      if (!control) {
        continue;
      }

      if (isBusy) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    }
  }

  private loadPositions(): void {
    this.positionsLoading = true;
    this.positionsApi.getAll().subscribe({
      next: (result) => {
        this.positionsLoading = false;
        this.positions = result?.isSuccess && result.data ? result.data : [];
      },
      error: () => {
        this.positionsLoading = false;
        this.positions = [];
      }
    });
  }

  onZipBlur(): void {
    const cep = String(this.form.value.addressZip ?? '').replace(/\D/g, '');
    this.cepError = undefined;

    if (cep.length !== 8) {
      return;
    }

    this.isLookingUpCep = true;
    this.setAddressLookupState(true);
    this.usersApi.getAddressByCep(cep).subscribe({
      next: (result) => {
        this.isLookingUpCep = false;
        this.setAddressLookupState(false);

        if (!result?.isSuccess || !result.data) {
          this.cepError = result?.message ?? 'Não foi possível localizar o CEP.';
          return;
        }

        this.form.patchValue({
          addressStreet: result.data.logradouro ?? '',
          addressComplement: result.data.complemento ?? '',
          addressNeighborhood: result.data.bairro ?? '',
          addressCity: result.data.localidade ?? '',
          addressState: (result.data.uf ?? '').toUpperCase()
        });
      },
      error: () => {
        this.isLookingUpCep = false;
        this.setAddressLookupState(false);
        this.cepError = 'Erro inesperado ao consultar o CEP.';
      }
    });
  }

  private prefillEmployeeFormFromSession(): void {
    const user = this.authSession.getUser();
    if (!user) return;

    this.employeeForm.patchValue(
      {
        name: user.name ?? '',
        email: user.email ?? '',
        cpf: user.cpf ?? '',
        phone: user.phone ?? ''
      },
      { emitEvent: false }
    );
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.submitError = undefined;

    if (this.form.invalid || this.isSubmitting) return;

    const user = this.authSession.getUser();
    if (!user) {
      this.submitError = 'Sessão inválida. Faça login novamente.';
      return;
    }

    const companyName = String(this.form.value.companyName ?? '').trim();
    const cnpj = String(this.form.value.cnpj ?? '').replace(/\D/g, '');
    const department = String(this.form.value.department ?? '').trim();
    const employeeCountRaw = String(this.form.value.employeeCount ?? '').trim();
    const employeeCount = Number(employeeCountRaw);

    const addressZip = String(this.form.value.addressZip ?? '').trim();
    const addressStreet = String(this.form.value.addressStreet ?? '').trim();
    const addressNumber = String(this.form.value.addressNumber ?? '').trim();
    const addressComplement = String(this.form.value.addressComplement ?? '').trim() || undefined;
    const addressNeighborhood = String(this.form.value.addressNeighborhood ?? '').trim();
    const addressCity = String(this.form.value.addressCity ?? '').trim();
    const addressState = String(this.form.value.addressState ?? '').trim();
    const addressCountry = String(this.form.value.addressCountry ?? '').trim();

    if (!Number.isFinite(employeeCount) || employeeCount <= 0) {
      this.submitError = 'Informe uma quantidade de funcionários válida.';
      return;
    }

    this.isSubmitting = true;

    const address = [addressStreet, addressNumber, addressComplement, addressNeighborhood, addressCity, addressState, addressZip, addressCountry]
      .filter(Boolean).join(', ');

    this.companiesApi.create({
      name: companyName,
      address,
      cnpj,
      numberOfMembers: employeeCount,
      category: department
    })
    .pipe(finalize(() => { this.isSubmitting = false; }))
    .subscribe({
      next: (result) => {
        if (!result?.isSuccess) {
          this.submitError = result?.message ?? 'Erro ao salvar empresa.';
          return;
        }

        // Persiste no localStorage para manter o fluxo de onboarding
        this.onboarding.completeCompanyOnboarding(user.userId, {
          companyName,
          department,
          employeeCount,
          addressZip,
          addressStreet,
          addressNumber,
          addressComplement,
          addressNeighborhood,
          addressCity,
          addressState,
          addressCountry
        });

        this.onboarding.startEmployeeOnboarding(user.userId);
        this.companyData = this.onboarding.getCompanyOnboardingData(user.userId);
        this.prefillEmployeeFormFromSession();
        this.step = 'employee';
      },
      error: () => {
        this.submitError = 'Erro inesperado ao salvar empresa.';
      }
    });
  }

  onEmployeeSave(): void {
    this.employeeFormSubmitted = true;
    this.employeeSubmitError = undefined;

    if (this.employeeForm.invalid || this.isEmployeeSubmitting) return;

    const user = this.authSession.getUser();
    if (!user) {
      this.employeeSubmitError = 'Sessão inválida. Faça login novamente.';
      return;
    }

    this.isEmployeeSubmitting = true;

    const name = String(this.employeeForm.getRawValue().name ?? '').trim();
    const email = String(this.employeeForm.getRawValue().email ?? '').trim();
    const cpf = String(this.employeeForm.getRawValue().cpf ?? '').trim() || undefined;
    const phone = String(this.employeeForm.getRawValue().phone ?? '').trim() || undefined;
    const birthDateRaw = String(this.employeeForm.getRawValue().birthDate ?? '').trim();
    const positionId = Number(this.employeeForm.getRawValue().positionId ?? 0);
    const birthDate = birthDateRaw ? `${birthDateRaw}T00:00:00` : new Date().toISOString();

    if (!Number.isFinite(positionId) || positionId <= 0) {
      this.employeeSubmitError = 'Selecione um cargo válido.';
      this.isEmployeeSubmitting = false;
      return;
    }

    this.usersApi.create({ name, email, cpf, phone, birthDate, role: 'USER', positionId })
      .pipe(finalize(() => { this.isEmployeeSubmitting = false; }))
      .subscribe({
        next: (result) => {
          if (!result?.isSuccess) {
            this.employeeSubmitError = result?.message ?? 'Erro ao cadastrar funcionário.';
            return;
          }
          this.onboarding.completeEmployeeOnboarding(user.userId, { name, email, cpf, phone, birthDate });
          this.router.navigate(['/page']);
        },
        error: () => {
          this.employeeSubmitError = 'Erro inesperado ao cadastrar funcionário.';
        }
      });
  }

  onEmployeeSkip(): void {
    const user = this.authSession.getUser();
    if (!user) {
      this.router.navigate(['/pages/login']);
      return;
    }

    this.onboarding.clearEmployeeOnboardingPending(user.userId);
    this.router.navigate(['/page']);
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = applyMaskCpf(input.value);
    input.value = masked;
    this.employeeForm.controls['cpf'].setValue(masked, { emitEvent: false });
  }
}
