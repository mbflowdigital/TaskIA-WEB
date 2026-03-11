import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import {
  CompaniesApiService,
  CreateCompanyRequest,
  UpdateCompanyRequest
} from '../../../shared/api/companies-api.service';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';

@Component({
  selector: 'app-companies-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './companies-create.component.html',
  styleUrls: ['./companies-create.component.scss']
})
export class CompaniesCreateComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isEditMode = false;
  editingCompanyId?: string;
  isLoading = false;
  loadError?: string;

  isSubmitting = false;
  submitError?: string;
  submitErrors: string[] = [];
  submitSuccess?: string;

  formSubmitted = false;

  form = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
    cnpj: new UntypedFormControl('', [Validators.required, Validators.pattern(/^([0-9]{14}|[0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\/?[0-9]{4}\-?[0-9]{2})$/)]),
    category: new UntypedFormControl('', [Validators.required]),
    address: new UntypedFormControl(''),
    numberOfMembers: new UntypedFormControl(1, [Validators.required, Validators.min(1)])
  });

  constructor(
    private readonly companiesApi: CompaniesApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authSession: AuthSessionService
  ) {}

  ngOnInit(): void {
    const role = this.authSession.getRole().trim().toUpperCase();
    if (role !== 'ADM_MASTER') {
      this.router.navigate(['/page']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEditMode = true;
    this.editingCompanyId = id;
    this.loadCompany(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.submitError = undefined;
    this.submitErrors = [];
    this.submitSuccess = undefined;

    if (this.form.invalid || this.isSubmitting) return;

    const rawValue = this.form.getRawValue();
    const payload = {
      name: String(rawValue.name ?? '').trim(),
      cnpj: String(rawValue.cnpj ?? '').replace(/\D/g, ''),
      category: String(rawValue.category ?? '').trim(),
      address: String(rawValue.address ?? '').trim() || undefined,
      numberOfMembers: Number(rawValue.numberOfMembers ?? 0)
    };

    this.isSubmitting = true;

    if (this.isEditMode) {
      const id = this.editingCompanyId;
      if (!id) {
        this.isSubmitting = false;
        this.submitError = 'Id da empresa não encontrado.';
        return;
      }

      const request: UpdateCompanyRequest = { id, ...payload };
      this.companiesApi
        .update(id, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.isSubmitting = false;

            if (!result?.isSuccess) {
              this.submitError = result?.message ?? 'Não foi possível atualizar a empresa.';
              this.submitErrors = result?.errors ?? [];
              return;
            }

            this.submitSuccess = result?.message ?? 'Empresa atualizada com sucesso.';
            this.router.navigate(['/companies']);
          },
          error: (err: unknown) => {
            this.isSubmitting = false;
            this.submitError =
              typeof err === 'object' && err && 'message' in err
                ? String((err as { message?: unknown }).message)
                : 'Erro inesperado ao atualizar a empresa.';
          }
        });

      return;
    }

    const request: CreateCompanyRequest = payload;
    this.companiesApi
      .create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;

          if (!result?.isSuccess) {
            this.submitError = result?.message ?? 'Não foi possível cadastrar a empresa.';
            this.submitErrors = result?.errors ?? [];
            return;
          }

          this.submitSuccess = result?.message ?? 'Empresa cadastrada com sucesso.';
          this.router.navigate(['/companies']);
        },
        error: (err: unknown) => {
          this.isSubmitting = false;
          this.submitError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao cadastrar a empresa.';
        }
      });
  }

  onReset(): void {
    this.formSubmitted = false;
    this.submitError = undefined;
    this.submitErrors = [];
    this.submitSuccess = undefined;
    this.loadError = undefined;
    this.form.reset({
      name: '',
      cnpj: '',
      category: '',
      address: '',
      numberOfMembers: 1
    });
  }

  private loadCompany(id: string): void {
    this.isLoading = true;
    this.loadError = undefined;

    this.companiesApi
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;

          if (!result?.isSuccess || !result.data) {
            this.loadError = result?.message ?? 'Não foi possível carregar a empresa.';
            return;
          }

          this.form.patchValue({
            name: result.data.name,
            cnpj: result.data.cnpj ?? '',
            category: result.data.category ?? '',
            address: result.data.address ?? '',
            numberOfMembers: result.data.numberOfMembers
          });
        },
        error: (err: unknown) => {
          this.isLoading = false;
          this.loadError =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: unknown }).message)
              : 'Erro inesperado ao carregar a empresa.';
        }
      });
  }
}