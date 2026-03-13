import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CompaniesApiService, CompanyDto } from '../../../shared/api/companies-api.service';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './companies-list.component.html',
  styleUrls: ['./companies-list.component.scss']
})
export class CompaniesListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading = false;
  loadError?: string;

  categoryFilter = '';
  statusFilter: '' | 'Active' | 'Close' = '';
  searchValue = '';
  limit = 10;

  companies: CompanyDto[] = [];
  filteredCompanies: CompanyDto[] = [];

  openActionsForId?: string;
  deletingCompanyId?: string;
  actionError?: string;

  constructor(
    private readonly companiesApi: CompaniesApiService,
    private readonly router: Router,
    private readonly authSession: AuthSessionService
  ) {}

  ngOnInit(): void {
    const role = this.authSession.getRole().trim().toUpperCase();
    if (role !== 'ADM_MASTER') {
      this.router.navigate(['/page']);
      return;
    }

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get visibleRows(): CompanyDto[] {
    return this.filteredCompanies.slice(0, this.limit);
  }

  trackById(_: number, company: CompanyDto): string {
    return company.id;
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
    const parsed = Number(value);
    this.limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  clearFilters(): void {
    this.categoryFilter = '';
    this.statusFilter = '';
    this.searchValue = '';
    this.limit = 10;
    this.applyFilter();
  }

  toggleActions(companyId: string): void {
    this.openActionsForId = this.openActionsForId === companyId ? undefined : companyId;
    this.actionError = undefined;
  }

  editCompany(company: CompanyDto): void {
    this.openActionsForId = undefined;
    this.router.navigate(['/companies', company.id, 'edit']);
  }

  viewCompany(company: CompanyDto): void {
    this.openActionsForId = undefined;
    this.router.navigate(['/companies', company.id]);
  }

  deleteCompany(company: CompanyDto): void {
    const confirmed = window.confirm(`Tem certeza que deseja remover a empresa "${company.name}"?`);
    if (!confirmed) return;

    this.deletingCompanyId = company.id;
    this.actionError = undefined;
    this.openActionsForId = undefined;

    this.companiesApi
      .delete(company.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result?.isSuccess) {
            this.actionError = result?.message ?? 'Não foi possível remover a empresa.';
            this.deletingCompanyId = undefined;
            return;
          }

          this.companies = this.companies.filter((item) => item.id !== company.id);
          this.applyFilter();
          this.deletingCompanyId = undefined;
        },
        error: (err: unknown) => {
          this.actionError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao remover a empresa.';
          this.deletingCompanyId = undefined;
        }
      });
  }

  private load(): void {
    this.isLoading = true;
    this.loadError = undefined;

    this.companiesApi
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result?.isSuccess || !result.data) {
            this.companies = [];
            this.filteredCompanies = [];
            this.loadError = result?.message ?? 'Não foi possível carregar as empresas.';
            this.isLoading = false;
            return;
          }

          this.companies = result.data;
          this.applyFilter();
          this.isLoading = false;
        },
        error: (err: unknown) => {
          this.companies = [];
          this.filteredCompanies = [];
          this.loadError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao carregar as empresas.';
          this.isLoading = false;
        }
      });
  }

  private applyFilter(): void {
    const term = this.searchValue.trim().toLowerCase();
    const categoryFilter = this.categoryFilter.trim().toLowerCase();
    const statusFilter = this.statusFilter;

    this.filteredCompanies = this.companies.filter((company) => {
      if (categoryFilter) {
        const category = (company.category ?? '').trim().toLowerCase();
        if (category !== categoryFilter) return false;
      }

      if (statusFilter) {
        const status = company.isActive ? 'Active' : 'Close';
        if (status !== statusFilter) return false;
      }

      if (!term) return true;

      const haystack = `${company.id} ${company.name} ${company.category ?? ''} ${company.address ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }
}