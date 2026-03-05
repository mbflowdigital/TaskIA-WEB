import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../shared/api/users-api.service';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';

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

  isSubmitting = false;
  submitError?: string;
  submitErrors: string[] = [];
  submitSuccess?: string;

  formSubmitted = false;

  form = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    cpf: new UntypedFormControl(''),
    phone: new UntypedFormControl(''),
    birthDate: new UntypedFormControl(''),
    role: new UntypedFormControl('USER')
  });

  constructor(
    private readonly usersApi: UsersApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authSession: AuthSessionService
  ) {}

  ngOnInit(): void {
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
            birthDate: birthVal
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

  get allowedRoles(): { value: string; label: string }[] {
    const myRole = this.authSession.getRole();
    if (myRole === 'ADM_MASTER') {
      return [
        { value: 'USER', label: 'Usuário' },
        { value: 'ADM', label: 'Administrador' },
        { value: 'ADM_MASTER', label: 'Administrador Master' }
      ];
    }
    if (myRole === 'ADM') {
      return [{ value: 'USER', label: 'Usuário' }];
    }
    return [{ value: 'USER', label: 'Usuário' }];
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
    // Send date as-is (yyyy-MM-dd) to avoid UTC timezone shifting
    const birthDate = birthDateRaw ? `${birthDateRaw}T00:00:00` : null;

    console.debug('[users-create] submit payload →', { name, phone, cpf, birthDate });

    if (this.isEditMode) {
      const id = this.editingUserId;
      if (!id) {
        this.isSubmitting = false;
        this.submitError = 'Id do usuário não encontrado.';
        return;
      }

      this.usersApi
        .update(id, { id, name, phone, cpf, birthDate })
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
    const role = String(this.form.getRawValue().role ?? 'USER');

    this.usersApi
      .create({ name, email, phone, cpf, birthDate, role })
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

  onReset(): void {
    this.formSubmitted = false;
    this.submitError = undefined;
    this.submitErrors = [];
    this.submitSuccess = undefined;
    this.loadError = undefined;
    this.form.reset({ name: '', email: '', phone: '', cpf: '', birthDate: '', role: 'USER' });

    if (this.isEditMode) {
      this.form.controls['email'].disable();
    }
  }
}
