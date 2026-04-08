import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../shared/api/users-api.service';
import { AuthSessionService } from '../../shared/auth/auth-session.service';
import { UserDto } from '../../shared/api/users/users.types';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  user?: UserDto;
  isLoading = true;
  loadError?: string;

  isSubmitting = false;
  submitError?: string;
  submitSuccess?: string;

  avatarUrl: string | null = null;
  isDragOver = false;
  private readonly MAX_PHOTO_MB = 5;

  form = new UntypedFormGroup({
    name: new UntypedFormControl('', Validators.required),
    phone: new UntypedFormControl(''),
    bio: new UntypedFormControl('')
  });

  private get userId(): string {
    return this.authSession.getUserId() ?? '';
  }

  private bioKey(): string { return `profile-bio-${this.userId}`; }

  constructor(
    private readonly usersApi: UsersApiService,
    private readonly authSession: AuthSessionService
  ) {}

  ngOnInit(): void {
    this.avatarUrl = localStorage.getItem(`profile-photo-${this.userId}`);
    this.authSession.loadAvatar(this.userId);

    this.usersApi.getById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.isLoading = false;
          if (!r?.isSuccess || !r.data) {
            this.loadError = r?.message ?? 'Não foi possível carregar os dados do perfil.';
            return;
          }
          this.user = r.data;
          this.form.patchValue({
            name: r.data.name,
            phone: r.data.phone ?? '',
            bio: localStorage.getItem(this.bioKey()) ?? ''
          });
        },
        error: () => {
          this.isLoading = false;
          this.loadError = 'Erro ao carregar perfil. Tente novamente.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) this.processPhotoFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processPhotoFile(file);
  }

  private processPhotoFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.submitError = 'Apenas imagens são permitidas (JPG, PNG, WEBP).';
      return;
    }
    if (file.size > this.MAX_PHOTO_MB * 1024 * 1024) {
      this.submitError = `A foto deve ter no máximo ${this.MAX_PHOTO_MB} MB.`;
      return;
    }
    this.submitError = undefined;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarUrl = e.target?.result as string;
      this.authSession.setAvatar(this.userId, this.avatarUrl);
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.avatarUrl = null;
    this.authSession.setAvatar(this.userId, null);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = undefined;
    this.submitSuccess = undefined;

    const raw = this.form.getRawValue();

    // Save bio and photo locally (backend doesn't have these fields)
    if (raw.bio?.trim()) {
      localStorage.setItem(this.bioKey(), raw.bio.trim());
    } else {
      localStorage.removeItem(this.bioKey());
    }
    if (this.avatarUrl) {
      this.authSession.setAvatar(this.userId, this.avatarUrl);
    }

    // PATCH: user updates their own name + phone
    this.usersApi.update(this.userId, {
      id: this.userId,
      name: raw.name.trim(),
      phone: raw.phone?.trim() || undefined,
      cpf: this.user?.cpf ?? undefined,
      birthDate: this.user?.birthDate ?? undefined,
      companyId: this.user?.companyId ?? undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r) => {
        this.isSubmitting = false;
        if (!r?.isSuccess) {
          this.submitError = r?.message ?? 'Não foi possível salvar as alterações.';
          return;
        }
        // Update session with new name
        const sessionUser = this.authSession.getUser();
        if (sessionUser) {
          this.authSession.setUser({ ...sessionUser, name: raw.name.trim() });
        }
        this.submitSuccess = 'Perfil atualizado com sucesso!';
        setTimeout(() => this.submitSuccess = undefined, 3000);
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Erro ao salvar. Tente novamente.';
      }
    });
  }

  get f() { return this.form.controls; }
}
