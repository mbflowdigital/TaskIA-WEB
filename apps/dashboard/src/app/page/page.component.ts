import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectDto } from '../shared/api/projects/projects.types';
import { ProjectsApiService } from '../shared/api/projects-api.service';
import { AuthSessionService } from '../shared/auth/auth-session.service';

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

  constructor(
    private router: Router,
    private projectsApi: ProjectsApiService,
    private authSession: AuthSessionService
  ) {}

  ngOnInit(): void {
    this.projectsApi.getAll(this.authSession.getUserId() ?? undefined).subscribe({
      next: (result) => {
        this.loadingProjects = false;
        if (result?.isSuccess && result.data?.length) {
          this.recentProjects = result.data
            .filter(p => p.status !== 'Inactive')
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4);
        }
      },
      error: () => { this.loadingProjects = false; }
    });
  }

  onSubmit(): void {
    const name = this.projectName.trim();
    if (!name) return;
    this.isLoading = true;
    this.router.navigate(['/projects/create'], { queryParams: { name } });
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
    } else {
      this.router.navigate(['/projects', project.id]);
    }
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
