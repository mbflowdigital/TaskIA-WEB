import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';
import { UserDto } from 'app/shared/api/users/users.types';

export interface CompanyDto {
  id: string;
  name: string;
  address?: string;
  cnpj?: string;
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
  cnpj?: string;
  numberOfMembers: number;
  category?: string;
}

export interface UpdateCompanyRequest {
  id: string;
  name: string;
  address?: string;
  cnpj?: string;
  numberOfMembers: number;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompaniesApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly authSession: AuthSessionService
  ) {}

  private getActorHeaders(): HttpHeaders {
    const user = this.authSession.getUser();
    let headers = new HttpHeaders();

    if (user?.userId) {
      headers = headers.set('X-User-Id', user.userId);
    }

    if (user?.role) {
      headers = headers.set('X-User-Role', user.role);
    }

    return headers;
  }

  getAll(): Observable<ApiResult<CompanyDto[]>> {
    return this.http
      .get<ApiResult<CompanyDto[]>>(`${this.baseUrl}/api/companies`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<CompanyDto[]>)));
  }

  create(request: CreateCompanyRequest): Observable<ApiResult<CompanyDto>> {
    return this.http
      .post<ApiResult<CompanyDto>>(`${this.baseUrl}/api/companies`, request, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<CompanyDto>)));
  }

  getById(id: string): Observable<ApiResult<CompanyDto>> {
    return this.http
      .get<ApiResult<CompanyDto>>(`${this.baseUrl}/api/companies/${id}`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<CompanyDto>)));
  }

  update(id: string, request: UpdateCompanyRequest): Observable<ApiResult<CompanyDto>> {
    return this.http
      .put<ApiResult<CompanyDto>>(`${this.baseUrl}/api/companies/${id}`, request, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<CompanyDto>)));
  }

  delete(id: string): Observable<ApiResult> {
    return this.http
      .delete<ApiResult>(`${this.baseUrl}/api/companies/${id}`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult)));
  }

  getUsersByCompany(id: string): Observable<ApiResult<UserDto[]>> {
    return this.http
      .get<ApiResult<UserDto[]>>(`${this.baseUrl}/api/companies/${id}/users`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto[]>)));
  }
}
