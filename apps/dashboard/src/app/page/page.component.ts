import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectDto } from '../shared/api/projects/projects.types';
import { ProjectsApiService } from '../shared/api/projects-api.service';
import { AuthSessionService } from '../shared/auth/auth-session.service';
import { UsersApiService } from '../shared/api/users-api.service';
import { CompaniesApiService } from '../shared/api/companies-api.service';
import { ClaudeApiService } from '../shared/api/claude-api.service';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class PageComponent implements OnInit {
  projectName = '';
  isLoading = false;

  recentProjects: ProjectDto[] = [];
  loadingProjects = true;
  companyName = 'Empresa';
  totalProjects = 0;
  totalUsers = 0;
  activeProjects = 0;
  myRole = 'USER';

  claudeError = '';
  suggestion: { description: string; objective: string } | null = null;
  suggestedProjectName = '';

  constructor(
    private router: Router,
    private projectsApi: ProjectsApiService,
    private authSession: AuthSessionService,
    private usersApi: UsersApiService,
    private companiesApi: CompaniesApiService,
    private claudeApi: ClaudeApiService
  ) {}

  ngOnInit(): void {
    this.myRole = this.authSession.getRole().trim().toUpperCase();
    const sessionUser = this.authSession.getUser();
    const companyId = sessionUser?.companyId ?? null;
    const companyName = sessionUser?.companyName ?? null;

    this.projectsApi.getAll().subscribe({
      next: (result) => {
        this.loadingProjects = false;
        const projects = result?.isSuccess && result.data?.length ? result.data : [];
        this.totalProjects = projects.length;
        this.activeProjects = projects.filter(p => p.status === 'Active').length;
        this.recentProjects = projects
          .filter(p => p.status !== 'Inactive')
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 4);
      },
      error: () => { this.loadingProjects = false; }
    });

    if (companyId) {
      this.companyName = companyName || 'Empresa';

      this.companiesApi.getUsersByCompany(companyId).subscribe({
        next: (result) => {
          const users = Array.isArray((result as any)?.data) ? (result as any).data : [];
          this.totalUsers = users.length;
        }
      });

      if (!companyName) {
        this.companiesApi.getById(companyId).subscribe({
          next: (companyResult) => {
            this.companyName = companyResult?.isSuccess && companyResult.data?.name
              ? companyResult.data.name
              : 'Empresa';
          }
        });
      }
    } else {
      this.companyName = this.myRole === 'ADM_MASTER' ? 'Todas as empresas' : 'Sem empresa vinculada';

      if (this.myRole === 'ADM_MASTER') {
        this.usersApi.getAll().subscribe({
          next: (result) => {
            this.totalUsers = result?.isSuccess && result.data?.length ? result.data.length : 0;
          }
        });
      }
    }
  }

  onSubmit(): void {
    const name = this.projectName.trim();
    if (!name) return;
    this.isLoading = true;
    this.claudeError = '';
    this.suggestion = null;

    this.claudeApi.suggestProject(name).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result?.isSuccess && result.data) {
          this.suggestedProjectName = name;
          this.suggestion = result.data;
        } else {
          this.claudeError = result?.message || 'Não foi possível gerar sugestão da IA.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.claudeError = 'Erro ao conectar com a IA. Tente novamente.';
      }
    });
  }

  confirmCreate(): void {
    if (!this.suggestion) return;
    this.router.navigate(['/projects/create'], {
      queryParams: {
        name: this.suggestedProjectName,
        description: this.suggestion.description,
        objective: this.suggestion.objective
      }
    });
  }

  discardSuggestion(): void {
    this.suggestion = null;
    this.suggestedProjectName = '';
    this.projectName = '';
    this.claudeError = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  openProject(project: ProjectDto): void {
    if (project.status === 'Draft') {
      this.router.navigate(['/projects', project.id, 'edit']);
    } else if (project.status === 'Active') {
      this.router.navigate(['/projects', project.id, 'board']);
    } else {
      this.router.navigate(['/projects', project.id]);
    }
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
