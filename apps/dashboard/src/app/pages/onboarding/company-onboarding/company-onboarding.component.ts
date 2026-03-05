import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthSessionService } from 'app/shared/auth/auth-session.service';
import { CompanyOnboardingData, OnboardingService } from 'app/shared/onboarding/onboarding.service';

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

  form = new UntypedFormGroup({
    companyName: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
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
    birthDate: new UntypedFormControl('')
  });

  constructor(
    private readonly authSession: AuthSessionService,
    private readonly onboarding: OnboardingService,
    private readonly router: Router
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

    // Mock: salva em localStorage até o backend existir.
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

    // Próximo passo: cadastro de funcionário (opcional)
    this.onboarding.startEmployeeOnboarding(user.userId);
    this.companyData = this.onboarding.getCompanyOnboardingData(user.userId);
    this.prefillEmployeeFormFromSession();
    this.step = 'employee';
    this.isSubmitting = false;
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
    const birthDate = birthDateRaw ? `${birthDateRaw}T00:00:00` : undefined;

    // Mock: salva em localStorage até o backend existir.
    this.onboarding.completeEmployeeOnboarding(user.userId, { name, email, cpf, phone, birthDate });

    this.isEmployeeSubmitting = false;
    this.router.navigate(['/page']);
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
}
