import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../shared/api/users-api.service';
import { UserDto } from 'app/shared/api/users/users.types';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private profileImageCache = new Map<string, string>();

  isLoading = false;
  loadError?: string;

  verifiedFilter: '' | 'Yes' | 'No' = '';
  roleFilter: '' | 'USER' | 'ADM' | 'ADM_MASTER' = '';
  statusFilter: '' | 'Active' | 'Close' | 'Banned' = '';

  searchValue = '';
  limit = 10;

  // Custom dropdown controls
  verifiedDropdownOpen = false;
  roleDropdownOpen = false;
  statusDropdownOpen = false;
  limitDropdownOpen = false;

  // Opções dos dropdowns
  readonly verifiedOptions = [
    { value: '', label: 'Qualquer' },
    { value: 'Yes', label: 'Sim' },
    { value: 'No', label: 'Não' }
  ];

  readonly roleOptions = [
    { value: '', label: 'Qualquer' },
    { value: 'USER', label: 'Usuário' },
    { value: 'ADM', label: 'Administrador' },
    { value: 'ADM_MASTER', label: 'Adm. Master' }
  ];

  readonly statusOptions = [
    { value: '', label: 'Qualquer' },
    { value: 'Active', label: 'Ativo' },
    { value: 'Close', label: 'Inativo' },
    { value: 'Banned', label: 'Banido' }
  ];

  readonly limitOptions = [
    { value: 10, label: '10' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 100, label: '100' }
  ];

  users: UserDto[] = [];
  filteredUsers: UserDto[] = [];

  openActionsForId?: string;
  deletingUserId?: string;
  actionError?: string;

  constructor(
    private readonly usersApi: UsersApiService,
    private readonly router: Router,
    private readonly authSession: AuthSessionService
  ) {}

  ngOnInit(): void {
    const role = this.authSession.getRole().trim().toUpperCase();
    const isAdmin = role === 'ADM' || role === 'ADM_MASTER';
    if (!isAdmin) {
      this.router.navigate(['/page']);
      return;
    }

    this.load();
  }

  ngOnDestroy(): void {
    // Limpar URLs de objetos criados para evitar memory leak
    this.profileImageCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.profileImageCache.clear();

    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.verifiedDropdownOpen = false;
    this.roleDropdownOpen = false;
    this.statusDropdownOpen = false;
    this.limitDropdownOpen = false;
  }

  get visibleRows(): UserDto[] {
    return this.filteredUsers.slice(0, this.limit);
  }

  trackById(_: number, user: UserDto): string {
    return user.id;
  }

  reload(): void {
    this.load();
  }

  filterUpdate(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchValue = value;
    this.applyFilter();
  }

  updateLimit(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '10';
    const parsed = typeof value === 'number' ? value : Number(value);
    this.limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  clearFilters(): void {
    this.verifiedFilter = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.searchValue = '';
    this.limit = 10;
    this.applyFilter();
  }

  // Custom dropdown methods - Verificado
  toggleVerifiedDropdown(event: Event): void {
    event.stopPropagation();
    this.verifiedDropdownOpen = !this.verifiedDropdownOpen;
    this.roleDropdownOpen = false;
    this.statusDropdownOpen = false;
  }

  selectVerified(value: '' | 'Yes' | 'No'): void {
    this.verifiedFilter = value;
    this.verifiedDropdownOpen = false;
    this.onFilterChange();
  }

  getSelectedVerifiedLabel(): string {
    const selected = this.verifiedOptions.find(opt => opt.value === this.verifiedFilter);
    return selected?.label || 'Qualquer';
  }

  // Custom dropdown methods - Perfil
  toggleRoleDropdown(event: Event): void {
    event.stopPropagation();
    this.roleDropdownOpen = !this.roleDropdownOpen;
    this.verifiedDropdownOpen = false;
    this.statusDropdownOpen = false;
  }

  selectRole(value: '' | 'USER' | 'ADM' | 'ADM_MASTER'): void {
    this.roleFilter = value;
    this.roleDropdownOpen = false;
    this.onFilterChange();
  }

  getSelectedRoleLabel(): string {
    const selected = this.roleOptions.find(opt => opt.value === this.roleFilter);
    return selected?.label || 'Qualquer';
  }

  // Custom dropdown methods - Status
  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    this.statusDropdownOpen = !this.statusDropdownOpen;
    this.verifiedDropdownOpen = false;
    this.roleDropdownOpen = false;
  }

  selectStatus(value: '' | 'Active' | 'Close' | 'Banned'): void {
    this.statusFilter = value;
    this.statusDropdownOpen = false;
    this.onFilterChange();
  }

  getSelectedStatusLabel(): string {
    const selected = this.statusOptions.find(opt => opt.value === this.statusFilter);
    return selected?.label || 'Qualquer';
  }

  // Custom dropdown methods - Limite
  toggleLimitDropdown(event: Event): void {
    event.stopPropagation();
    this.limitDropdownOpen = !this.limitDropdownOpen;
    this.verifiedDropdownOpen = false;
    this.roleDropdownOpen = false;
    this.statusDropdownOpen = false;
  }

  selectLimit(value: number): void {
    this.limit = value;
    this.limitDropdownOpen = false;
  }

  getSelectedLimitLabel(): string {
    return this.limit.toString();
  }

  getUserProfileImageUrl(userId: string): string | null {
    if (this.profileImageCache.has(userId)) {
      return this.profileImageCache.get(userId) || null;
    }

    // Carregar imagem de forma assíncrona
    this.usersApi.getProfileImageBlob(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          if (blob && blob.size > 0) {
            const url = URL.createObjectURL(blob);
            this.profileImageCache.set(userId, url);
          } else {
            this.profileImageCache.set(userId, '');
          }
        },
        error: () => {
          this.profileImageCache.set(userId, '');
        }
      });

    return null;
  }

  getUserInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getAvatarSrc(index: number): string {
    const avatarId = (index % 18) + 1;
    return `assets/img/portrait/small/avatar-s-${avatarId}.png`;
  }

  toggleActions(userId: string): void {
    if (this.openActionsForId === userId) {
      this.openActionsForId = undefined;
      return;
    }

    this.openActionsForId = userId;
    this.actionError = undefined;
  }

  editUser(user: UserDto): void {
    this.openActionsForId = undefined;
    this.actionError = undefined;
    this.router.navigate(['/users', user.id, 'edit']);
  }

  deleteUser(user: UserDto): void {
    const confirmed = window.confirm(`Tem certeza que deseja apagar o usuário "${user.name}"?`);
    if (!confirmed) return;

    this.deletingUserId = user.id;
    this.actionError = undefined;
    this.openActionsForId = undefined;

    this.usersApi
      .delete(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result?.isSuccess) {
            this.actionError = result?.message ?? 'Não foi possível apagar o usuário.';
            this.deletingUserId = undefined;
            return;
          }

          this.users = this.users.filter((u) => u.id !== user.id);
          this.applyFilter();
          this.deletingUserId = undefined;
        },
        error: (err: unknown) => {
          this.actionError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao apagar o usuário.';
          this.deletingUserId = undefined;
        }
      });
  }

  private load(): void {
    this.isLoading = true;
    this.loadError = undefined;

    this.usersApi
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result?.isSuccess || !result.data) {
            this.users = [];
            this.filteredUsers = [];
            this.loadError = result?.message ?? 'Não foi possível carregar os usuários';
            this.isLoading = false;
            return;
          }

          this.users = result.data;
          this.applyFilter();
          this.isLoading = false;
        },
        error: (err: unknown) => {
          this.users = [];
          this.filteredUsers = [];
          this.loadError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao carregar os usuários';
          this.isLoading = false;
        }
      });
  }

  private applyFilter(): void {
    const term = this.searchValue.trim().toLowerCase();
    const verifiedFilter = this.verifiedFilter;
    const roleFilter = this.roleFilter;
    const statusFilter = this.statusFilter;

    this.filteredUsers = this.users.filter((u) => {
      if (verifiedFilter) {
        const isVerified = u.isEmailVerified ? 'Yes' : 'No';
        if (isVerified !== verifiedFilter) return false;
      }

      if (roleFilter) {
        const role = (u.role ?? 'USER').toUpperCase();
        if (role !== roleFilter.toUpperCase()) return false;
      }

      if (statusFilter) {
        const status = u.isActive ? 'Active' : 'Close';
        if (status !== statusFilter) return false;
      }

      if (!term) return true;

      const haystack = `${u.id} ${u.name} ${u.email} ${u.phone ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }
}

