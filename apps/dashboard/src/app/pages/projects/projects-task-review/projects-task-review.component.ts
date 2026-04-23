import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NgbTooltipModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { BoardApiService, BoardTaskDto } from '../../../shared/api/board-api.service';
import { ProjectsApiService } from '../../../shared/api/projects-api.service';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';

@Component({
  selector: 'app-projects-task-review',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbTooltipModule],
  templateUrl: './projects-task-review.component.html',
  styleUrls: ['./projects-task-review.component.scss']
})
export class ProjectsTaskReviewComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly modalService = inject(NgbModal);
  private readonly cdr = inject(ChangeDetectorRef);

  projectId?: string;
  projectName = '';
  isLoading = true;
  loadError?: string;

  // Task data
  macroTasks: BoardTaskDto[] = [];
  allTasks: BoardTaskDto[] = [];
  selectedTasks: Set<string> = new Set();
  isDeletingTask = new Set<string>();
  isEditingTask = new Set<string>();

  // Filters and view options
  viewMode: 'macros' | 'all' = 'macros';
  priorityFilter: string = 'all';
  responsibleFilter: string = 'all';
  searchTerm = '';

  // Edit mode
  editingTask?: BoardTaskDto;
  editForm = {
    name: '',
    description: '',
    priority: '',
    prazoEmDias: 0
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly boardApi: BoardApiService,
    private readonly projectsApi: ProjectsApiService,
    private readonly authSession: AuthSessionService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || undefined;
    if (!this.projectId) {
      this.loadError = 'ID do projeto não encontrado.';
      this.isLoading = false;
      return;
    }

    this.loadProjectAndTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProjectAndTasks(): void {
    this.isLoading = true;
    this.loadError = undefined;

    // Load project info
    this.projectsApi.getById(this.projectId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.isSuccess && result.data) {
            this.projectName = result.data.name;
          }
        },
        error: () => {
          // Continue even if project info fails
        }
      });

    // Load tasks
    this.boardApi.getByProject(this.projectId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (!result?.isSuccess || !Array.isArray(result.data)) {
            this.loadError = result?.message ?? 'Erro ao carregar tarefas.';
            return;
          }

          this.allTasks = result.data.sort((a, b) => a.ordemNoBoard - b.ordemNoBoard);
          this.macroTasks = this.allTasks.filter(t => !t.parentTaskId);
          this.updateFilteredTasks();
        },
        error: () => {
          this.isLoading = false;
          this.loadError = 'Erro ao carregar tarefas.';
        }
      });
  }

  get filteredTasks(): BoardTaskDto[] {
    let tasks = this.viewMode === 'macros' ? this.macroTasks : this.allTasks;

    if (this.priorityFilter !== 'all') {
      tasks = tasks.filter(t => t.priority === this.priorityFilter);
    }

    if (this.responsibleFilter !== 'all') {
      tasks = tasks.filter(t => t.sugestaoResponsavelName === this.responsibleFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      tasks = tasks.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term)
      );
    }

    return tasks;
  }

  private updateFilteredTasks(): void {
    // Trigger change detection for filtered results
    this.cdr.detectChanges();
  }

  get availablePriorities(): string[] {
    const priorities = new Set(this.allTasks.map(t => t.priority));
    return Array.from(priorities).sort();
  }

  get availableResponsibles(): string[] {
    const responsibles = new Set(
      this.allTasks
        .map(t => t.sugestaoResponsavelName)
        .filter(name => name)
    );
    return Array.from(responsibles).sort();
  }

  getSubtasks(task: BoardTaskDto): BoardTaskDto[] {
    return this.allTasks.filter(t => t.parentTaskId === task.id);
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'Crítica': 'priority-critical',
      'Alta': 'priority-high',
      'Média': 'priority-medium',
      'Baixa': 'priority-low'
    };
    return classes[priority] || 'priority-medium';
  }

  getPriorityEmoji(priority: string): string {
    const emojis: Record<string, string> = {
      'Crítica': '🔴',
      'Alta': '🟠',
      'Média': '🟡',
      'Baixa': '🟢'
    };
    return emojis[priority] || '🟡';
  }

  toggleTaskSelection(taskId: string): void {
    if (this.selectedTasks.has(taskId)) {
      this.selectedTasks.delete(taskId);
    } else {
      this.selectedTasks.add(taskId);
    }
  }

  selectAllTasks(): void {
    this.filteredTasks.forEach(task => this.selectedTasks.add(task.id));
  }

  deselectAllTasks(): void {
    this.selectedTasks.clear();
  }

  deleteSelectedTasks(): void {
    if (this.selectedTasks.size === 0) return;

    const taskIds = Array.from(this.selectedTasks);
    const deletePromises = taskIds.map(id => {
      this.isDeletingTask.add(id);
      return this.boardApi.delete(id).toPromise();
    });

    Promise.all(deletePromises)
      .then(() => {
        // Reload tasks
        this.loadProjectAndTasks();
        this.selectedTasks.clear();
      })
      .catch(() => {
        // Handle error
        this.selectedTasks.clear();
        taskIds.forEach(id => this.isDeletingTask.delete(id));
      });
  }

  startEditTask(task: BoardTaskDto): void {
    this.editingTask = task;
    this.editForm = {
      name: task.name,
      description: task.description || '',
      priority: task.priority,
      prazoEmDias: task.prazoEmDias || 0
    };
    this.isEditingTask.add(task.id);
  }

  cancelEditTask(): void {
    if (this.editingTask) {
      this.isEditingTask.delete(this.editingTask.id);
      this.editingTask = undefined;
    }
  }

  saveEditTask(): void {
    if (!this.editingTask) return;

    // TODO: Implement task update API call
    // For now, just cancel edit
    this.cancelEditTask();
  }

  regenerateTasks(): void {
    // Navigate back to project creation for regeneration
    this.router.navigate(['/projects/create', this.projectId], {
      queryParams: { step: 5, regenerate: true }
    });
  }

  goToBoard(): void {
    this.router.navigate(['/projects', this.projectId, 'board']);
  }

  onFilterChange(): void {
    this.updateFilteredTasks();
  }

  onSearchChange(): void {
    this.updateFilteredTasks();
  }

  trackByTaskId(index: number, task: BoardTaskDto): string {
    return task.id;
  }
}