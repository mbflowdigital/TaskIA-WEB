import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthApiService } from 'app/shared/api/auth-api.service';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';
import { AuthRefreshService } from 'app/shared/auth/auth-refresh.service';
import { LoginData } from 'app/shared/api/auth/auth.types';
import { OnboardingService } from 'app/shared/onboarding/onboarding.service';

function applyMaskCpf(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1-$2');
}

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {

  // ── Login form ──────────────────────────────────────────────────────────
  loginFormSubmitted = false;
  isLoginFailed = false;
  loginError = '';
  isSubmitting = false;

  loginForm = new UntypedFormGroup({
    cpf:      new UntypedFormControl('', [Validators.required]),
    password: new UntypedFormControl('', [Validators.required])
  });

  // ── First-access modal ───────────────────────────────────────────────────
  showFirstAccessModal = false;
  firstAccessSubmitted = false;
  firstAccessError = '';
  firstAccessSuccess = false;
  isChangingPassword = false;

  private firstAccessCpf = '';
  private firstAccessCurrentPassword = '';

  firstAccessForm = new UntypedFormGroup({
    newPassword:     new UntypedFormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new UntypedFormControl('', [Validators.required])
  });

  constructor(
    private readonly router: Router,
    private readonly authApi: AuthApiService,
    private readonly authSession: AuthSessionService,
    private readonly authRefresh: AuthRefreshService,
    private readonly onboarding: OnboardingService,
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone
  ) {}

  get lf() { return this.loginForm.controls; }
  get faf() { return this.firstAccessForm.controls; }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = applyMaskCpf(input.value);
    input.value = masked;
    this.loginForm.controls['cpf'].setValue(masked, { emitEvent: false });
  }

  private persistSessionAndRedirect(data: LoginData): void {
    this.authSession.setSession(data);
    this.authRefresh.resetRefreshTimer(); // Reset o timer após login
    this.router.navigate([data.requiresOnboarding ? '/onboarding' : '/page']);
  }

  // ── Submit login ─────────────────────────────────────────────────────────
  onSubmit(): void {
    this.loginFormSubmitted = true;
    this.isLoginFailed = false;
    this.loginError = '';

    if (this.loginForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    const cpf      = String(this.loginForm.value.cpf ?? '').trim().replace(/\D/g, '');
    const password = String(this.loginForm.value.password ?? '');

    this.authApi.login({ cpf, password })
      .pipe(finalize(() => { this.isSubmitting = false; this.cdr.detectChanges(); }))
      .subscribe({
      next: (result) => {
        this.zone.run(() => {
        if (!result?.isSuccess || !result.data) {
          this.isLoginFailed = true;
          this.loginError = result?.message ?? 'Credenciais inválidas.';
          return;
        }

        const data: LoginData = result.data;

        if (data.isFirstAccess) {
          this.firstAccessCpf = cpf;
          this.firstAccessCurrentPassword = password;
          this.showFirstAccessModal = true;
          this.cdr.detectChanges();
          return;
        }

        this.persistSessionAndRedirect(data);
        });
      },
      error: () => {
        this.zone.run(() => {
        this.isLoginFailed = true;
        this.loginError = 'Erro inesperado. Tente novamente.';
        });
      }
    });
  }

  // ── Submit change-password (first access) ─────────────────────────────────
  onChangePasswordSubmit(): void {
    this.firstAccessSubmitted = true;
    this.firstAccessError = '';

    if (this.firstAccessForm.invalid || this.isChangingPassword) return;

    const newPassword     = String(this.faf['newPassword'].value ?? '');
    const confirmPassword = String(this.faf['confirmPassword'].value ?? '');

    if (newPassword !== confirmPassword) {
      this.firstAccessError = 'As senhas não coincidem.';
      return;
    }

    this.isChangingPassword = true;

    this.authApi.changePasswordFirstAccess({
      cpf: this.firstAccessCpf,
      currentPassword: this.firstAccessCurrentPassword,
      newPassword,
      confirmPassword
    }).pipe(finalize(() => { this.isChangingPassword = false; }))
      .subscribe({
      next: (result) => {
        if (!result?.isSuccess || !result.data) {
          this.firstAccessError = result?.message ?? 'Não foi possível alterar a senha.';
          return;
        }

        this.firstAccessSuccess = true;

        // Fecha o modal e segue para onboarding/dashboard com a sessão retornada pela API
        setTimeout(() => {
          this.showFirstAccessModal = false;
          this.firstAccessSuccess = false;
          this.firstAccessForm.reset();
          this.firstAccessSubmitted = false;
          this.loginForm.patchValue({ password: newPassword });
          this.persistSessionAndRedirect(result.data as LoginData);
        }, 2000);
      },
      error: () => {
        this.firstAccessError = 'Erro inesperado ao alterar a senha.';
      }
    });
  }

  closeFirstAccessModal(): void {
    this.showFirstAccessModal = false;
    this.firstAccessForm.reset();
    this.firstAccessSubmitted = false;
    this.firstAccessError = '';
    this.firstAccessSuccess = false;
  }
}
