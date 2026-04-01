import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { BoardApiService, BoardTaskDto, BoardStatus, BOARD_STATUSES } from '../../../shared/api/board-api.service';
import { ProjectsApiService } from '../../../shared/api/projects-api.service';
import { UsersApiService } from '../../../shared/api/users-api.service';

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule],
  templateUrl: './project-board.component.html',
  styleUrls: ['./project-board.component.scss']
})
export class ProjectBoardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  projectId = '';
  projectName = '';

  boardTasks: BoardTaskDto[] = [];
  boardLoading = false;
  boardError?: string;

  readonly kanbanStatuses: BoardStatus[] = BOARD_STATUSES;
  readonly kanbanPageSize = 10;

  taskActionLoading: Record<string, boolean> = {};
  taskActionFeedback: Record<string, { type: 'success' | 'error'; message: string }> = {};
  editingResponsible: Record<string, boolean> = {};
  editingResponsibleModal = false;
  editingPrazoModal = false;
  prazoModalValue: number | null = null;
  selectedTask: BoardTaskDto | null = null;
  columnVisibleCount: Record<string, number> = { 'A Fazer': 10, 'Em Andamento': 10, 'Concluído': 10 };

  teamMembers: Array<{ id: string; name: string }> = [];

  private readonly priorityOrder: Record<string, number> = {
    crítica: 0, critica: 0, alta: 1, média: 2, media: 2, baixa: 3
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly boardApi: BoardApiService,
    private readonly projectsApi: ProjectsApiService,
    private readonly usersApi: UsersApiService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.projectId) {
      this.router.navigate(['/projects']);
      return;
    }
    this.loadProjectName();
    this.loadTeamMembers();
    this.fetchBoardTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loaders ──────────────────────────────────────────────────────────

  private loadProjectName(): void {
    this.projectsApi.getById(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result && result.isSuccess && result.data) {
            this.projectName = result.data.name;
          }
        },
        error: () => {}
      });
  }

  private loadTeamMembers(): void {
    this.usersApi.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result && result.isSuccess && result.data) {
            this.teamMembers = result.data
              .filter(u => u.isActive)
              .map(u => ({ id: u.id, name: u.name }));
          }
        },
        error: () => {}
      });
  }

  fetchBoardTasks(): void {
    this.boardLoading = true;
    this.boardError = undefined;
    this.boardApi.getByProject(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.boardLoading = false;
          if (result && result.isSuccess && result.data) {
            this.boardTasks = result.data;
            this.columnVisibleCount = { 'A Fazer': 10, 'Em Andamento': 10, 'Concluído': 10 };
          } else {
            this.boardError = (result && result.message) ? result.message : 'Erro ao carregar tarefas.';
          }
        },
        error: () => {
          this.boardLoading = false;
          this.boardError = 'Erro de conexão ao carregar tarefas.';
        }
      });
  }

  // ── Kanban helpers ────────────────────────────────────────────────────────

  getTasksByStatus(status: BoardStatus): BoardTaskDto[] {
    return this.boardTasks
      .filter(t => t.status === status)
      .sort((a, b) => {
        const pa = this.priorityOrder[a.priority?.toLowerCase()] ?? 99;
        const pb = this.priorityOrder[b.priority?.toLowerCase()] ?? 99;
        return pa !== pb ? pa - pb : a.ordemNoBoard - b.ordemNoBoard;
      });
  }

  getVisibleTasksByStatus(status: BoardStatus): BoardTaskDto[] {
    return this.getTasksByStatus(status).slice(0, this.columnVisibleCount[status] ?? this.kanbanPageSize);
  }

  getHiddenCount(status: BoardStatus): number {
    return Math.max(0, this.getTasksByStatus(status).length - (this.columnVisibleCount[status] ?? this.kanbanPageSize));
  }

  loadMoreTasks(status: BoardStatus): void {
    this.columnVisibleCount[status] = (this.columnVisibleCount[status] ?? this.kanbanPageSize) + this.kanbanPageSize;
  }

  getConnectedLists(): string[] {
    return this.kanbanStatuses.map(s => `pb-col-${s}`);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  onChangeTaskStatus(task: BoardTaskDto, newStatus: string): void {
    if (task.status === newStatus || this.taskActionLoading[task.id]) return;
    this.taskActionLoading[task.id] = true;
    this.clearFeedback(task.id);
    this.boardApi.updateStatus(task.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.taskActionLoading[task.id] = false;
          if (result && result.isSuccess && result.data) {
            const idx = this.boardTasks.findIndex(t => t.id === task.id);
            if (idx !== -1) this.boardTasks[idx] = result.data;
            this.boardTasks = [...this.boardTasks];
            this.showFeedback(task.id, 'success', 'Status atualizado!');
          } else {
            this.showFeedback(task.id, 'error', (result && result.message) ? result.message : 'Erro ao atualizar status.');
          }
        },
        error: () => {
          this.taskActionLoading[task.id] = false;
          this.showFeedback(task.id, 'error', 'Erro de conexão.');
        }
      });
  }

  onAssignResponsavel(task: BoardTaskDto, userId: string): void {
    if (this.taskActionLoading[task.id]) return;
    this.taskActionLoading[task.id] = true;
    this.clearFeedback(task.id);
    this.boardApi.assignResponsavel(task.id, userId || null)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.taskActionLoading[task.id] = false;
          if (result && result.isSuccess && result.data) {
            const idx = this.boardTasks.findIndex(t => t.id === task.id);
            if (idx !== -1) this.boardTasks[idx] = result.data;
            this.boardTasks = [...this.boardTasks];
            this.editingResponsible[task.id] = false;
            this.showFeedback(task.id, 'success', 'Responsável atualizado!');
          } else {
            this.showFeedback(task.id, 'error', (result && result.message) ? result.message : 'Erro ao atualizar responsável.');
          }
        },
        error: () => {
          this.taskActionLoading[task.id] = false;
          this.showFeedback(task.id, 'error', 'Erro de conexão.');
        }
      });
  }

  onUpdatePrazo(task: BoardTaskDto, dias: number): void {
    const value = Number(dias);
    if (!value || value < 1 || this.taskActionLoading[task.id]) return;
    this.taskActionLoading[task.id] = true;
    this.clearFeedback(task.id);
    this.boardApi.updatePrazo(task.id, value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.taskActionLoading[task.id] = false;
          if (result && result.isSuccess && result.data) {
            const idx = this.boardTasks.findIndex(t => t.id === task.id);
            if (idx !== -1) this.boardTasks[idx] = result.data;
            this.boardTasks = [...this.boardTasks];
            if (this.selectedTask && this.selectedTask.id === task.id) {
              this.selectedTask = result.data;
            }
            this.editingPrazoModal = false;
            this.showFeedback(task.id, 'success', 'Prazo atualizado!');
          } else {
            this.showFeedback(task.id, 'error', (result && result.message) ? result.message : 'Erro ao atualizar prazo.');
          }
        },
        error: () => {
          this.taskActionLoading[task.id] = false;
          this.showFeedback(task.id, 'error', 'Erro de conexão.');
        }
      });
  }

  onKanbanDrop(event: CdkDragDrop<BoardTaskDto[]>, targetStatus: BoardStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.onChangeTaskStatus(task, targetStatus);
    }
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'alta':    return 'priority-alta';
      case 'média':
      case 'media':   return 'priority-media';
      case 'baixa':   return 'priority-baixa';
      case 'crítica':
      case 'critica': return 'priority-critica';
      default:        return 'priority-media';
    }
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
      alta: 'Alta', média: 'Média', media: 'Média', baixa: 'Baixa', crítica: 'Crítica', critica: 'Crítica'
    };
    return map[priority?.toLowerCase()] ?? priority;
  }

  private showFeedback(taskId: string, type: 'success' | 'error', message: string): void {
    this.taskActionFeedback[taskId] = { type, message };
    setTimeout(() => this.clearFeedback(taskId), 3000);
  }

  private clearFeedback(taskId: string): void {
    delete this.taskActionFeedback[taskId];
  }
}
