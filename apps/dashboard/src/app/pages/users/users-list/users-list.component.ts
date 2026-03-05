import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../shared/api/users-api.service';
import { UserDto } from 'app/shared/api/users/users.types';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading = false;
  loadError?: string;

  verifiedFilter: '' | 'Yes' | 'No' = '';
  roleFilter: '' | 'USER' | 'ADM' | 'ADM_MASTER' = '';
  statusFilter: '' | 'Active' | 'Close' | 'Banned' = '';

  searchValue = '';
  limit = 10;

  users: UserDto[] = [];
  filteredUsers: UserDto[] = [];

  openActionsForId?: string;
  deletingUserId?: string;
  actionError?: string;

  constructor(
    private readonly usersApi: UsersApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

