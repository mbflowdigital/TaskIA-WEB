import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';

export interface CompanyDto {
  id: string;
  name: string;
  address?: string;
  numberOfMembers: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  userCount: number;
}

export interface CreateCompanyRequest {
  name: string;
  address?: string;
  numberOfMembers: number;
  category?: string;
}

export interface UpdateCompanyRequest {
  id: string;
  name: string;
  address?: string;
  numberOfMembers: number;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompaniesApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  create(request: CreateCompanyRequest): Observable<ApiResult<CompanyDto>> {
    return this.http
      .post<ApiResult<CompanyDto>>(`${this.baseUrl}/api/companies`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<CompanyDto>)));
  }

  getById(id: string): Observable<ApiResult<CompanyDto>> {
    return this.http
      .get<ApiResult<CompanyDto>>(`${this.baseUrl}/api/companies/${id}`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<CompanyDto>)));
  }

  update(id: string, request: UpdateCompanyRequest): Observable<ApiResult<CompanyDto>> {
    return this.http
      .put<ApiResult<CompanyDto>>(`${this.baseUrl}/api/companies/${id}`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<CompanyDto>)));
  }

  delete(id: string): Observable<ApiResult> {
    return this.http
      .delete<ApiResult>(`${this.baseUrl}/api/companies/${id}`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult)));
  }

  getUsersByCompany(id: string): Observable<ApiResult> {
    return this.http
      .get<ApiResult>(`${this.baseUrl}/api/companies/${id}/users`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult)));
  }
}
