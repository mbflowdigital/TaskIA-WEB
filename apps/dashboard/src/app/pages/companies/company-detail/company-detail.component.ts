import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CompaniesApiService, CompanyDto } from '../../../shared/api/companies-api.service';
import { UserDto } from 'app/shared/api/users/users.types';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './company-detail.component.html'
})
export class CompanyDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading = false;
  company?: CompanyDto;
  users: UserDto[] = [];
  loadError?: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authSession: AuthSessionService,
    private readonly companiesApi: CompaniesApiService
  ) {}

  ngOnInit(): void {
    const role = this.authSession.getRole().trim().toUpperCase();
    if (role !== 'ADM_MASTER') {
      this.router.navigate(['/page']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/companies']);
      return;
    }

    this.load(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private load(companyId: string): void {
    this.isLoading = true;
    this.loadError = undefined;

    this.companiesApi
      .getById(companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result?.isSuccess || !result.data) {
            this.loadError = result?.message ?? 'Não foi possível carregar a empresa.';
            this.isLoading = false;
            return;
          }

          this.company = result.data;
          this.loadUsers(companyId);
        },
        error: (err: unknown) => {
          this.loadError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao carregar a empresa.';
          this.isLoading = false;
        }
      });
  }

  private loadUsers(companyId: string): void {
    this.companiesApi
      .getUsersByCompany(companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.users = result?.isSuccess && result.data ? result.data : [];
          if (!result?.isSuccess && !this.loadError) {
            this.loadError = result?.message ?? 'Não foi possível carregar os funcionários da empresa.';
          }
          this.isLoading = false;
        },
        error: (err: unknown) => {
          this.users = [];
          if (!this.loadError) {
            this.loadError =
              typeof err === 'object' && err && 'message' in err
                ? String((err as { message?: unknown }).message)
                : 'Erro inesperado ao carregar os funcionários da empresa.';
          }
          this.isLoading = false;
        }
      });
  }
}