import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ProjectsApiService } from '../../../shared/api/projects-api.service';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { ProjectDto } from 'app/shared/api/projects/projects.types';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading = false;
  loadError?: string;

  statusFilter: '' | 'Active' | 'Inactive' | 'Draft' = '';
  searchValue = '';
  limit = 10;

  projects: ProjectDto[] = [];
  filteredProjects: ProjectDto[] = [];

  openActionsForId?: string;
  dropdownPos: { top: number; left: number } | null = null;
  deletingProjectId?: string;
  actionError?: string;

  constructor(
    private readonly projectsApi: ProjectsApiService,
    private readonly authSession: AuthSessionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get visibleRows(): ProjectDto[] {
    return this.filteredProjects.slice(0, this.limit);
  }

  trackById(_: number, project: ProjectDto): string {
    return project.id;
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
    this.statusFilter = '';
    this.searchValue = '';
    this.limit = 10;
    this.applyFilter();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  closeDropdown(): void {
    this.openActionsForId = undefined;
    this.dropdownPos = null;
  }

  toggleActions(projectId: string, event: MouseEvent): void {
    if (this.openActionsForId === projectId) {
      this.openActionsForId = undefined;
      this.dropdownPos = null;
    } else {
      this.openActionsForId = projectId;
      const btn = event.currentTarget as HTMLElement;
      const rect = btn.getBoundingClientRect();
      this.dropdownPos = { top: rect.bottom + window.scrollY, left: rect.right - 140 + window.scrollX };
    }
    this.actionError = undefined;
  }

  editProject(project: ProjectDto): void {
    this.openActionsForId = undefined;
    this.router.navigate(['/projects', project.id, 'edit']);
  }

  deleteProject(project: ProjectDto): void {
    const confirmed = window.confirm(`Tem certeza que deseja cancelar o projeto "${project.name}"?`);
    if (!confirmed) return;

    this.deletingProjectId = project.id;
    this.actionError = undefined;
    this.openActionsForId = undefined;

    this.projectsApi
      .delete(project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result?.isSuccess) {
            this.actionError = result?.message ?? 'Não foi possível cancelar o projeto.';
            this.deletingProjectId = undefined;
            return;
          }
          this.projects = this.projects.filter((p) => p.id !== project.id);
          this.applyFilter();
          this.deletingProjectId = undefined;
        },
        error: () => {
          this.actionError = 'Erro inesperado ao cancelar o projeto.';
          this.deletingProjectId = undefined;
        }
      });
  }

  togglingStatusId?: string;

  toggleProjectStatus(project: ProjectDto): void {
    this.togglingStatusId = project.id;
    this.actionError = undefined;
    this.openActionsForId = undefined;

    this.projectsApi
      .toggleStatus(project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.togglingStatusId = undefined;
          if (!result?.isSuccess || !result.data) {
            this.actionError = result?.message ?? 'Não foi possível alterar o status do projeto.';
            return;
          }
          const idx = this.projects.findIndex(p => p.id === project.id);
          if (idx !== -1) this.projects[idx] = result.data;
          this.applyFilter();
        },
        error: () => {
          this.togglingStatusId = undefined;
          this.actionError = 'Erro inesperado ao alterar o status do projeto.';
        }
      });
  }

  private load(): void {
    this.isLoading = true;
    this.loadError = undefined;

    this.projectsApi
      .getAll(this.authSession.getUserId() ?? undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result?.isSuccess || !result.data) {
            this.projects = [];
            this.filteredProjects = [];
            this.loadError = result?.message ?? 'Não foi possível carregar os projetos';
            this.isLoading = false;
            return;
          }
          this.projects = result.data;
          this.applyFilter();
          this.isLoading = false;
        },
        error: () => {
          this.projects = [];
          this.filteredProjects = [];
          this.loadError = 'Erro inesperado ao carregar os projetos';
          this.isLoading = false;
        }
      });
  }

  private applyFilter(): void {
    const term = this.searchValue.trim().toLowerCase();

    this.filteredProjects = this.projects.filter((p) => {
      if (this.statusFilter) {
        const status = p.status ?? (p.isActive ? 'Active' : 'Inactive');
        if (status !== this.statusFilter) return false;
      }
      if (!term) return true;
      const haystack = `${p.id} ${p.name} ${p.description ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }
}
