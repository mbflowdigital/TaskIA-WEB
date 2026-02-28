import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ProjectsApiService } from '../../../shared/api/projects-api.service';

@Component({
  selector: 'app-projects-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './projects-create.component.html',
  styleUrls: ['./projects-create.component.scss']
})
export class ProjectsCreateComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isEditMode = false;
  editingProjectId?: string;
  isLoading = false;
  loadError?: string;

  isSubmitting = false;
  submitError?: string;
  submitErrors: string[] = [];
  submitSuccess?: string;

  formSubmitted = false;

  // TODO: replace with auth service when ready
  private readonly CURRENT_USER_ID = '67aecf6f-1f1a-49a2-8ba4-65fbb04f8531';

  form = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]),
    description: new UntypedFormControl(''),
    objective: new UntypedFormControl(''),
    startDate: new UntypedFormControl(''),
    endDate: new UntypedFormControl('')
  });

  get f() { return this.form.controls; }

  constructor(
    private readonly projectsApi: ProjectsApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const nameParam = this.route.snapshot.queryParamMap.get('name');
    if (nameParam) {
      this.form.patchValue({ name: nameParam });
    }
    if (!id) return;

    this.isEditMode = true;
    this.editingProjectId = id;
    this.isLoading = true;

    this.projectsApi
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (!result?.isSuccess || !result.data) {
            this.loadError = result?.message ?? 'Não foi possível carregar o projeto.';
            return;
          }
          this.form.patchValue({
            name: result.data.name,
            description: result.data.description ?? '',
            objective: result.data.objective ?? '',
            startDate: result.data.startDate ? result.data.startDate.substring(0, 10) : '',
            endDate: result.data.endDate ? result.data.endDate.substring(0, 10) : ''
          });
        },
        error: () => {
          this.isLoading = false;
          this.loadError = 'Erro inesperado ao carregar o projeto.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onReset(): void {
    this.form.reset({ name: '', description: '', objective: '', startDate: '', endDate: '' });
    this.formSubmitted = false;
    this.submitError = undefined;
    this.submitErrors = [];
    this.submitSuccess = undefined;
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.submitError = undefined;
    this.submitErrors = [];
    this.submitSuccess = undefined;

    const { name, description, objective, startDate, endDate } = this.form.getRawValue();
    const toIso = (v: string) => v ? new Date(v).toISOString() : null;

    const request$ = this.isEditMode
      ? this.projectsApi.update(this.editingProjectId!, {
          id: this.editingProjectId!,
          userId: this.CURRENT_USER_ID,
          name,
          description: description || undefined,
          objective: objective || undefined,
          startDate: toIso(startDate),
          endDate: toIso(endDate)
        })
      : this.projectsApi.create({
          userId: this.CURRENT_USER_ID,
          name,
          description: description || undefined,
          objective: objective || undefined,
          startDate: toIso(startDate),
          endDate: toIso(endDate)
        });

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        if (!result?.isSuccess) {
          this.submitError = result?.message ?? 'Não foi possível salvar o projeto.';
          this.submitErrors = (result as any)?.errors ?? [];
          return;
        }
        this.submitSuccess = this.isEditMode ? 'Projeto atualizado com sucesso!' : 'Projeto criado com sucesso!';
        if (!this.isEditMode) {
          this.form.reset({ name: '', description: '', objective: '', startDate: '', endDate: '' });
          this.formSubmitted = false;
        }
        setTimeout(() => this.router.navigate(['/projects']), 1200);
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Erro inesperado ao salvar o projeto.';
      }
    });
  }
}
