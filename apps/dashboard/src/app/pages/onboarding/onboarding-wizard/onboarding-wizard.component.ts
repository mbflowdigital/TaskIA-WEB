import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthApiService } from 'app/shared/api/auth-api.service';
import { UsersApiService } from 'app/shared/api/users-api.service';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';

export type WizardStep = 'welcome' | 'company' | 'location' | 'team';

const STEPS: WizardStep[] = ['welcome', 'company', 'location', 'team'];

function normalizeCnpj(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

function isValidBasicCnpj(value: string | null | undefined): boolean {
  return normalizeCnpj(value).length === 14;
}

function applyMaskCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding-wizard.component.html',
  styleUrls: ['./onboarding-wizard.component.scss']
})
export class OnboardingWizardComponent implements OnInit {
  currentStep: WizardStep = 'welcome';
  isAnimating = false;
  isSubmitting = false;
  submitError?: string;
  showPreview = false;
  isLookingUpCep = false;
  cepError?: string;

  userName = '';
  userId = '';

  // ── Formulário unificado ───────────────────────────────────────────────
  companyForm = new UntypedFormGroup({
    companyName: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    cnpj: new UntypedFormControl('', [Validators.required, control => isValidBasicCnpj(control.value) ? null : { cnpj: true }]),
    category: new UntypedFormControl('', [Validators.required])
  });

  locationForm = new UntypedFormGroup({
    addressStreet: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    addressNumber: new UntypedFormControl('', [Validators.required]),
    addressComplement: new UntypedFormControl(''),
    addressNeighborhood: new UntypedFormControl('', [Validators.required]),
    addressCity: new UntypedFormControl('', [Validators.required]),
    addressState: new UntypedFormControl('', [Validators.required, Validators.maxLength(2), Validators.minLength(2)]),
    addressZip: new UntypedFormControl('', [Validators.required, Validators.minLength(8)])
  });

  teamForm = new UntypedFormGroup({
    numberOfMembers: new UntypedFormControl('', [Validators.required, Validators.min(1)])
  });

  // ── Submitted flags ─────────────────────────────────────────────────────
  companySubmitted = false;
  locationSubmitted = false;
  teamSubmitted = false;

  // ── Category options ─────────────────────────────────────────────────────
  readonly categories = [
    'Tecnologia',
    'Saúde',
    'Educação',
    'Finanças',
    'Varejo',
    'Indústria',
    'Serviços',
    'Construção',
    'Agronegócio',
    'Outro'
  ];

  constructor(
    private readonly authSession: AuthSessionService,
    private readonly authApi: AuthApiService,
    private readonly usersApi: UsersApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authSession.getUser();
    if (!user) {
      this.router.navigate(['/pages/login']);
      return;
    }

    if (!this.authSession.requiresOnboarding()) {
      this.router.navigate(['/page']);
      return;
    }

    this.userName = user.name;
    this.userId = user.userId;
  }

  // ── Getters ──────────────────────────────────────────────────────────────
  get cf() { return this.companyForm.controls; }
  get lf() { return this.locationForm.controls; }
  get tf() { return this.teamForm.controls; }

  get stepIndex(): number {
    return STEPS.indexOf(this.currentStep);
  }

  get progressPercent(): number {
    return Math.round(((this.stepIndex) / (STEPS.length - 1)) * 100);
  }

  get fullAddress(): string {
    const v = this.locationForm.value;
    const parts = [
      v.addressStreet,
      v.addressNumber,
      v.addressComplement,
      v.addressNeighborhood,
      v.addressCity,
      v.addressState,
      v.addressZip,
      'Brasil'
    ].filter(Boolean);
    return parts.join(', ');
  }

  private setLocationLookupState(isBusy: boolean): void {
    const controls = [
      'addressZip',
      'addressStreet',
      'addressNumber',
      'addressComplement',
      'addressNeighborhood',
      'addressCity',
      'addressState'
    ];

    for (const controlName of controls) {
      const control = this.locationForm.get(controlName);
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

  onCnpjInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = applyMaskCnpj(input.value);
    input.value = masked;
    this.companyForm.controls['cnpj'].setValue(masked, { emitEvent: false });
  }

  onZipBlur(): void {
    const cep = String(this.locationForm.value.addressZip ?? '').replace(/\D/g, '');
    this.cepError = undefined;

    if (cep.length !== 8) {
      return;
    }

    this.isLookingUpCep = true;
    this.setLocationLookupState(true);

    this.usersApi.getAddressByCep(cep).subscribe({
      next: (result) => {
        this.isLookingUpCep = false;
        this.setLocationLookupState(false);

        if (!result?.isSuccess || !result.data) {
          this.cepError = result?.message ?? 'Não foi possível localizar o CEP.';
          return;
        }

        this.locationForm.patchValue({
          addressStreet: result.data.logradouro ?? '',
          addressComplement: result.data.complemento ?? '',
          addressNeighborhood: result.data.bairro ?? '',
          addressCity: result.data.localidade ?? '',
          addressState: (result.data.uf ?? '').toUpperCase()
        });
      },
      error: () => {
        this.isLookingUpCep = false;
        this.setLocationLookupState(false);
        this.cepError = 'Erro inesperado ao consultar o CEP.';
      }
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  goToStep(step: WizardStep): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    setTimeout(() => {
      this.currentStep = step;
      this.isAnimating = false;
    }, 200);
  }

  next(): void {
    switch (this.currentStep) {
      case 'welcome':
        this.goToStep('company');
        break;
      case 'company':
        this.companySubmitted = true;
        if (this.companyForm.invalid) return;
        this.goToStep('location');
        break;
      case 'location':
        this.locationSubmitted = true;
        if (this.locationForm.invalid) return;
        this.goToStep('team');
        break;
      case 'team':
        this.teamSubmitted = true;
        if (this.teamForm.invalid) return;
        this.showPreview = true;
        break;
    }
  }

  back(): void {
    switch (this.currentStep) {
      case 'company':   this.goToStep('welcome');  break;
      case 'location':  this.goToStep('company');  break;
      case 'team':
        if (this.showPreview) { this.showPreview = false; }
        else { this.goToStep('location'); }
        break;
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  submit(): void {
    if (this.isSubmitting) return;
    this.submitError = undefined;
    this.isSubmitting = true;

    const numberOfMembers = Number(this.teamForm.value.numberOfMembers);

    this.authApi.onboarding({
      userId: this.userId,
      companyName: String(this.companyForm.value.companyName).trim(),
      address: this.fullAddress,
      cnpj: normalizeCnpj(String(this.companyForm.value.cnpj ?? '')),
      numberOfMembers,
      category: String(this.companyForm.value.category).trim()
    })
    .pipe(finalize(() => { this.isSubmitting = false; }))
    .subscribe({
      next: (result) => {
        if (!result?.isSuccess) {
          this.submitError = result?.message ?? 'Erro ao concluir onboarding.';
          return;
        }
        // Limpa flag e redireciona para o dashboard
        this.authSession.clearOnboardingFlag();
        this.router.navigate(['/page']);
      },
      error: () => {
        this.submitError = 'Erro inesperado. Tente novamente.';
      }
    });
  }
}
