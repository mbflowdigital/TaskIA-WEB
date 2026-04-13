import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';

import { BoardApiService, BoardTaskDto, BoardStatus, BOARD_STATUSES, UpdateBoardRequest } from '../../../shared/api/board-api.service';
import { ProjectsApiService } from '../../../shared/api/projects-api.service';
import { UsersApiService } from '../../../shared/api/users-api.service';

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DragDropModule],
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
  parentTaskInView: BoardTaskDto | null = null;
  taskNameEdit = '';
  taskDescEdit = '';
  taskStatusEdit = '';
  saveTaskLoading = false;
  columnVisibleCount: Record<string, number> = { 'A Fazer': 10, 'Em Andamento': 10, 'Concluído': 10 };

  criticalWarningTaskId: string | null = null;

  teamMembers: Array<{ id: string; name: string }> = [];

  activeTab: 'backlog' | 'board' = 'backlog';

  backlogSortField: 'priority' | 'status' | 'prazoEmDias' | 'name' = 'priority';
  backlogSortDir: 'asc' | 'desc' = 'asc';
  backlogFilter = '';
  backlogPage = 1;
  readonly backlogPageSize = 15;
  expandedTasks: Record<string, boolean> = {};

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
    // Observar mudanças no parâmetro 'id' para suportar navegação entre projetos
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const projectId = params.get('id') ?? '';
        if (!projectId) {
          this.router.navigate(['/projects']);
          return;
        }

        // Resetar estado ao trocar de projeto
        this.projectId = projectId;
        this.projectName = '';
        this.boardTasks = [];
        this.selectedTask = null;
        this.parentTaskInView = null;
        this.expandedTasks = {};
        this.columnVisibleCount = { 'A Fazer': 10, 'Em Andamento': 10, 'Concluído': 10 };
        
        // Carregar dados do novo projeto
        this.loadProjectName();
        this.loadTeamMembers();
        this.fetchBoardTasks();
      });
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

  isCritical(task: BoardTaskDto): boolean {
    const p = task.priority?.toLowerCase();
    return p === 'crítica' || p === 'critica';
  }

  getCriticalByStatus(status: BoardStatus): BoardTaskDto[] {
    return this.getTasksByStatus(status).filter(t => this.isCritical(t));
  }

  getNonCriticalByStatus(status: BoardStatus): BoardTaskDto[] {
    return this.getTasksByStatus(status).filter(t => !this.isCritical(t));
  }

  hasPendingCriticals(): boolean {
    return this.boardTasks.some(t => this.isCritical(t) && t.status === 'A Fazer');
  }

  /**
   * Atualiza uma tarefa tanto no array principal quanto nas subtarefas da tarefa pai
   */
  private updateTaskInList(updatedTask: BoardTaskDto): void {
    // Atualiza no array principal
    const idx = this.boardTasks.findIndex(t => t.id === updatedTask.id);
    if (idx !== -1) {
      this.boardTasks[idx] = updatedTask;
    }

    // Se for uma subtarefa, atualiza também no array subTasks da tarefa pai
    if (updatedTask.parentTaskId) {
      const parentIdx = this.boardTasks.findIndex(t => t.id === updatedTask.parentTaskId);
      if (parentIdx !== -1 && this.boardTasks[parentIdx].subTasks) {
        const subIdx = this.boardTasks[parentIdx].subTasks!.findIndex(st => st.id === updatedTask.id);
        if (subIdx !== -1) {
          this.boardTasks[parentIdx].subTasks![subIdx] = updatedTask;
        }
      }
    }

    // Se for uma tarefa pai, atualiza ela mas preserva as subtarefas existentes se não vieram na resposta
    if (!updatedTask.parentTaskId && idx !== -1) {
      const existingTask = this.boardTasks[idx];
      if (existingTask.subTasks && !updatedTask.subTasks) {
        this.boardTasks[idx].subTasks = existingTask.subTasks;
      }
    }

    // Força atualização da view
    this.boardTasks = [...this.boardTasks];
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  onChangeTaskStatus(task: BoardTaskDto, newStatus: string): void {
    if (task.status === newStatus || this.taskActionLoading[task.id]) return;
    if (newStatus === 'Em Andamento' && !this.isCritical(task) && this.hasPendingCriticals()) {
      this.criticalWarningTaskId = task.id;
      return;
    }
    this.taskActionLoading[task.id] = true;
    this.clearFeedback(task.id);
    
    // Se for uma subtarefa, marcar a tarefa pai como loading também
    if (task.parentTaskId) {
      this.taskActionLoading[task.parentTaskId] = true;
    }
    
    this.boardApi.updateStatus(task.id, newStatus)
      .pipe(
        switchMap((result) => {
          // Atualiza a subtarefa no visual imediatamente
          if (result && result.isSuccess && result.data) {
            this.updateTaskInList(result.data);
            if (this.selectedTask && this.selectedTask.id === task.id) {
              this.selectedTask = result.data;
            }
          }
          
          // Se for subtarefa, busca a tarefa pai atualizada (backend já sincronizou)
          if (task.parentTaskId && result && result.isSuccess) {
            return this.boardApi.getById(task.parentTaskId);
          }
          
          return [result];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          this.taskActionLoading[task.id] = false;
          
          if (task.parentTaskId) {
            this.taskActionLoading[task.parentTaskId] = false;
            
            // Atualiza a tarefa pai no visual
            if (result && result.isSuccess && result.data) {
              this.updateTaskInList(result.data);
              if (this.selectedTask && this.selectedTask.id === task.parentTaskId) {
                this.selectedTask = result.data;
              }
            }
          }
          
          this.showFeedback(task.id, 'success', 'Status atualizado!');
        },
        error: () => {
          this.taskActionLoading[task.id] = false;
          if (task.parentTaskId) {
            this.taskActionLoading[task.parentTaskId] = false;
          }
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
            this.updateTaskInList(result.data);
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
            this.updateTaskInList(result.data);
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

  onDeleteTask(task: BoardTaskDto): void {
    if (!confirm(`Excluir a tarefa "${task.name}"? Esta ação não pode ser desfeita.`)) return;
    this.taskActionLoading[task.id] = true;
    this.clearFeedback(task.id);
    this.boardApi.delete(task.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.taskActionLoading[task.id] = false;
          if (result && result.isSuccess === false) {
            this.showFeedback(task.id, 'error', result.message ?? 'Erro ao excluir tarefa.');
            return;
          }
          
          // Remove do array principal
          this.boardTasks = this.boardTasks.filter(t => t.id !== task.id);
          
          // Se for uma subtarefa, remove também do array subTasks da tarefa pai
          if (task.parentTaskId) {
            const parentIdx = this.boardTasks.findIndex(t => t.id === task.parentTaskId);
            if (parentIdx !== -1 && this.boardTasks[parentIdx].subTasks) {
              this.boardTasks[parentIdx].subTasks = this.boardTasks[parentIdx].subTasks!.filter(st => st.id !== task.id);
              this.boardTasks = [...this.boardTasks];
            }
          }
          
          this.selectedTask = null;
        },
        error: () => {
          this.taskActionLoading[task.id] = false;
          this.showFeedback(task.id, 'error', 'Erro de conexão ao excluir tarefa.');
        }
      });
  }

  onKanbanDrop(event: CdkDragDrop<BoardTaskDto[]>, targetStatus: BoardStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      if (targetStatus === 'Em Andamento' && !this.isCritical(task) && this.hasPendingCriticals()) {
        // Revert the visual move
        transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
        this.criticalWarningTaskId = task.id;
        return;
      }
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

  // ── Backlog helpers ───────────────────────────────────────────────────────

  get backlogFilteredTasks(): BoardTaskDto[] {
    const term = this.backlogFilter.toLowerCase().trim();
    // Filtrar apenas tarefas pai (sem parentTaskId)
    let tasks = this.boardTasks.filter(t => !t.parentTaskId).filter(t =>
      !term ||
      t.name?.toLowerCase().includes(term) ||
      t.id?.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term) ||
      (t.responsavelName?.toLowerCase().includes(term) ?? false) ||
      // Buscar também nas subtarefas
      (t.subTasks?.some(st => 
        st.name?.toLowerCase().includes(term) ||
        st.description?.toLowerCase().includes(term) ||
        (st.responsavelName?.toLowerCase().includes(term) ?? false)
      ) ?? false)
    );

    const dir = this.backlogSortDir === 'asc' ? 1 : -1;
    tasks = [...tasks].sort((a, b) => {
      if (this.backlogSortField === 'priority') {
        const pa = this.priorityOrder[a.priority?.toLowerCase()] ?? 99;
        const pb = this.priorityOrder[b.priority?.toLowerCase()] ?? 99;
        return (pa - pb) * dir;
      }
      if (this.backlogSortField === 'prazoEmDias') {
        return ((a.prazoEmDias ?? 0) - (b.prazoEmDias ?? 0)) * dir;
      }
      const va = String((a as any)[this.backlogSortField] ?? '').toLowerCase();
      const vb = String((b as any)[this.backlogSortField] ?? '').toLowerCase();
      return va < vb ? -dir : va > vb ? dir : 0;
    });

    return tasks;
  }

  get backlogTasks(): BoardTaskDto[] {
    const start = (this.backlogPage - 1) * this.backlogPageSize;
    return this.backlogFilteredTasks.slice(start, start + this.backlogPageSize);
  }

  get backlogCriticalTasks(): BoardTaskDto[] {
    return this.backlogTasks.filter(t => this.isCritical(t));
  }

  get backlogNonCriticalTasks(): BoardTaskDto[] {
    return this.backlogTasks.filter(t => !this.isCritical(t));
  }

  get backlogTotalPages(): number {
    return Math.max(1, Math.ceil(this.backlogFilteredTasks.length / this.backlogPageSize));
  }

  get backlogPageEnd(): number {
    return Math.min(this.backlogPage * this.backlogPageSize, this.backlogFilteredTasks.length);
  }

  get backlogPages(): number[] {
    const total = this.backlogTotalPages;
    const current = this.backlogPage;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      range.push(i);
    }
    return range;
  }

  backlogGoToPage(page: number): void {
    if (page < 1 || page > this.backlogTotalPages) return;
    this.backlogPage = page;
  }

  setBacklogSort(field: typeof this.backlogSortField): void {
    if (this.backlogSortField === field) {
      this.backlogSortDir = this.backlogSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.backlogSortField = field;
      this.backlogSortDir = 'asc';
    }
    this.backlogPage = 1;
  }

  backlogSortIcon(field: typeof this.backlogSortField): string {
    if (this.backlogSortField !== field) return 'ft-chevron-up';
    return this.backlogSortDir === 'asc' ? 'ft-chevron-up' : 'ft-chevron-down';
  }

  toggleTaskExpansion(taskId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.expandedTasks[taskId] = !this.expandedTasks[taskId];
  }

  isTaskExpanded(taskId: string): boolean {
    return !!this.expandedTasks[taskId];
  }

  getSubTasksCount(task: BoardTaskDto): number {
    return task.subTasks?.length ?? 0;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'A Fazer':      return 'bl-badge-todo';
      case 'Em Andamento': return 'bl-badge-doing';
      case 'Concluído':    return 'bl-badge-done';
      default:             return 'bl-badge-todo';
    }
  }

  openModal(task: BoardTaskDto, parentTask?: BoardTaskDto): void {
    // Se não foi passado parentTask mas a tarefa tem parentTaskId, buscar a tarefa pai
    if (!parentTask && task.parentTaskId) {
      parentTask = this.boardTasks.find(t => t.id === task.parentTaskId) ?? null;
    }
    
    this.selectedTask = task;
    this.parentTaskInView = parentTask ?? null;
    this.taskNameEdit = task.name;
    this.taskDescEdit = task.description ?? '';
    this.taskStatusEdit = task.status;
    this.editingResponsibleModal = false;
    this.editingPrazoModal = false;
  }

  openSubTaskModal(subTask: BoardTaskDto, parentTask: BoardTaskDto): void {
    this.openModal(subTask, parentTask);
  }

  backToParentTask(): void {
    if (this.parentTaskInView) {
      this.openModal(this.parentTaskInView);
    }
  }

  get isViewingSubTask(): boolean {
    return this.parentTaskInView !== null;
  }

  get hasSubTasks(): boolean {
    return !this.isViewingSubTask && (this.selectedTask?.subTasks?.length ?? 0) > 0;
  }

  get showSidebar(): boolean {
    return this.hasSubTasks || this.isViewingSubTask;
  }

  onSaveTask(): void {
    if (!this.selectedTask || this.saveTaskLoading) return;
    const trimmedName = this.taskNameEdit.trim();
    if (!trimmedName) return;
    const task = this.selectedTask;
    // Block non-critical tasks from moving to Em Andamento while criticals are pending
    if (this.taskStatusEdit === 'Em Andamento' && !this.isCritical(task) && this.hasPendingCriticals()) {
      this.criticalWarningTaskId = task.id;
      return;
    }
    this.saveTaskLoading = true;
    this.clearFeedback(task.id);
    const req: UpdateBoardRequest = {
      name: trimmedName,
      description: this.taskDescEdit.trim() || undefined,
      priority: task.priority,
      prazoEmDias: task.prazoEmDias,
      ordemNoBoard: task.ordemNoBoard
    };
    const statusChanged = this.taskStatusEdit !== task.status;
    this.boardApi.update(task.id, req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result?.isSuccess) {
            this.saveTaskLoading = false;
            this.showFeedback(task.id, 'error', result?.message ?? 'Erro ao salvar tarefa.');
            return;
          }
          const updated = result.data!;
          if (!statusChanged) {
            this.saveTaskLoading = false;
            this.updateTaskInList(updated);
            this.selectedTask = updated;
            this.taskNameEdit = updated.name;
            this.taskDescEdit = updated.description ?? '';
            this.showFeedback(task.id, 'success', 'Tarefa salva!');
            return;
          }
          this.boardApi.updateStatus(task.id, this.taskStatusEdit)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (statusResult) => {
                this.saveTaskLoading = false;
                const final = (statusResult?.isSuccess && statusResult.data) ? statusResult.data : updated;
                this.updateTaskInList(final);
                this.selectedTask = final;
                this.taskNameEdit = final.name;
                this.taskDescEdit = final.description ?? '';
                this.taskStatusEdit = final.status;
                this.showFeedback(task.id, 'success', 'Tarefa salva!');
              },
              error: () => {
                this.saveTaskLoading = false;
                this.showFeedback(task.id, 'error', 'Erro de conexão ao atualizar status.');
              }
            });
        },
        error: () => {
          this.saveTaskLoading = false;
          this.showFeedback(task.id, 'error', 'Erro de conexão.');
        }
      });
  }

  private showFeedback(taskId: string, type: 'success' | 'error', message: string): void {
    this.taskActionFeedback[taskId] = { type, message };
    setTimeout(() => this.clearFeedback(taskId), 3000);
  }

  private clearFeedback(taskId: string): void {
    delete this.taskActionFeedback[taskId];
  }

  copiedTaskId = false;

  trackByTaskId(_index: number, task: BoardTaskDto): string {
    return task.id;
  }

  copyTaskId(id: string): void {
    navigator.clipboard.writeText(id).then(() => {
      this.copiedTaskId = true;
      setTimeout(() => { this.copiedTaskId = false; }, 1800);
    });
  }
}
