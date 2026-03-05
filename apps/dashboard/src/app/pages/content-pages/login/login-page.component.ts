import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthApiService } from 'app/shared/api/auth-api.service';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';
import { LoginData } from 'app/shared/api/auth/auth.types';
import { OnboardingService } from 'app/shared/onboarding/onboarding.service';

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
    private readonly onboarding: OnboardingService,
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone
  ) {}

  get lf() { return this.loginForm.controls; }
  get faf() { return this.firstAccessForm.controls; }

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

        // Token salvo e redireciona
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        this.authSession.setUser({
          userId: data.userId,
          name: data.name,
          email: data.email,
          cpf: data.cpf,
          phone: data.phone,
          role: data.role
        });

        const user = this.authSession.getUser();
        if (user && this.onboarding.isAdminMock(user) && !this.onboarding.isCompanyOnboardingCompleted(user.userId)) {
          this.router.navigate(['/onboarding/company']);
          return;
        }

        this.router.navigate(['/page']);
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
        if (!result?.isSuccess) {
          this.firstAccessError = result?.message ?? 'Não foi possível alterar a senha.';
          return;
        }

        this.firstAccessSuccess = true;

        // Re-faz login com a nova senha automaticamente após 2s
        setTimeout(() => {
          this.showFirstAccessModal = false;
          this.firstAccessSuccess = false;
          this.firstAccessForm.reset();
          this.firstAccessSubmitted = false;
          this.loginForm.patchValue({ password: newPassword });
          this.onSubmit();
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
