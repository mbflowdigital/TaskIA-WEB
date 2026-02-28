import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectDto } from '../shared/api/projects/projects.types';
import { ProjectsApiService } from '../shared/api/projects-api.service';

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
    private projectsApi: ProjectsApiService
  ) {}

  ngOnInit(): void {
    this.projectsApi.getAll().subscribe({
      next: (result) => {
        this.loadingProjects = false;
        if (result?.isSuccess && result.data?.length) {
          this.recentProjects = result.data
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

  openProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
