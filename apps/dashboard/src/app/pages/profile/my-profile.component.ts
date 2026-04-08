import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../shared/api/users-api.service';
import { AuthSessionService } from '../../shared/auth/auth-session.service';
import { UserDto } from '../../shared/api/users/users.types';

function formatCpf(raw: string | null | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1-$2');
}

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
  isUploadingPhoto = false;
  isRemovingPhoto = false;
  uploadPhotoError?: string;
  selectedFile?: File;
  private currentBlobUrl?: string;

  form = new UntypedFormGroup({
    name: new UntypedFormControl('', Validators.required),
    phone: new UntypedFormControl(''),
    bio: new UntypedFormControl('')
  });

  private get userId(): string {
    return this.authSession.getUserId() ?? '';
  }

  get formattedCpf(): string {
    return formatCpf(this.user?.cpf);
  }

  private bioKey(): string { return `profile-bio-${this.userId}`; }

  constructor(
    private readonly usersApi: UsersApiService,
    private readonly authSession: AuthSessionService
  ) {}

  ngOnInit(): void {
    // Carrega a imagem do backend como blob
    this.loadProfileImage();

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
    
    // Libera a ObjectURL para evitar memory leak
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) this.processPhotoFile(file);
    input.value = '';
  }

  private loadProfileImage(): void {
    // Libera ObjectURL anterior se existir
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = undefined;
    }

    this.usersApi.getProfileImageBlob(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          if (blob && blob.size > 0) {
            this.currentBlobUrl = URL.createObjectURL(blob);
            this.avatarUrl = this.currentBlobUrl;
          } else {
            this.avatarUrl = null;
          }
        },
        error: () => {
          this.avatarUrl = null;
        }
      });
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
      this.uploadPhotoError = 'Apenas imagens são permitidas (JPG, PNG, WEBP).';
      setTimeout(() => this.uploadPhotoError = undefined, 5000);
      return;
    }
    if (file.size > this.MAX_PHOTO_MB * 1024 * 1024) {
      this.uploadPhotoError = `A foto deve ter no máximo ${this.MAX_PHOTO_MB} MB.`;
      setTimeout(() => this.uploadPhotoError = undefined, 5000);
      return;
    }
    
    this.selectedFile = file;
    this.uploadPhotoError = undefined;
    
    // Preview da imagem enquanto faz upload
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Faz upload para o backend
    this.uploadPhoto();
  }

  uploadPhoto(): void {
    if (!this.selectedFile) return;

    this.isUploadingPhoto = true;
    this.uploadPhotoError = undefined;

    this.usersApi.uploadProfileImage(this.userId, this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.isUploadingPhoto = false;
          if (!r?.isSuccess) {
            this.uploadPhotoError = r?.message ?? 'Erro ao enviar foto.';
            this.avatarUrl = null;
            setTimeout(() => this.uploadPhotoError = undefined, 5000);
            return;
          }
          // Recarrega a imagem do servidor
          this.loadProfileImage();
          this.submitSuccess = 'Foto de perfil atualizada com sucesso!';
          setTimeout(() => this.submitSuccess = undefined, 3000);
        },
        error: () => {
          this.isUploadingPhoto = false;
          this.uploadPhotoError = 'Erro ao enviar foto. Tente novamente.';
          this.avatarUrl = null;
          setTimeout(() => this.uploadPhotoError = undefined, 5000);
        }
      });
  }

  removePhoto(): void {
    if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      return;
    }

    this.isRemovingPhoto = true;
    this.uploadPhotoError = undefined;

    this.usersApi.deleteProfileImage(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.isRemovingPhoto = false;
          if (!r?.isSuccess) {
            this.uploadPhotoError = r?.message ?? 'Erro ao remover foto.';
            setTimeout(() => this.uploadPhotoError = undefined, 5000);
            return;
          }
          this.avatarUrl = null;
          this.submitSuccess = 'Foto de perfil removida com sucesso!';
          setTimeout(() => this.submitSuccess = undefined, 3000);
        },
        error: () => {
          this.isRemovingPhoto = false;
          this.uploadPhotoError = 'Erro ao remover foto. Tente novamente.';
          setTimeout(() => this.uploadPhotoError = undefined, 5000);
        }
      });
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

    // Save bio locally (backend doesn't have this field)
    if (raw.bio?.trim()) {
      localStorage.setItem(this.bioKey(), raw.bio.trim());
    } else {
      localStorage.removeItem(this.bioKey());
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
