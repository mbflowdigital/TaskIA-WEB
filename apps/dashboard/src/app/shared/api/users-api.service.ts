import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';
import { CheckEmailResponse, CreateUserRequest, UpdateUserRequest, UserDto } from 'app/shared/api/users/users.types';

@Injectable({
  providedIn: 'root'
})
export class UsersApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  create(request: CreateUserRequest): Observable<ApiResult<UserDto>> {
    return this.http
      .post<ApiResult<UserDto>>(`${this.baseUrl}/api/users`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto>)));
  }

  getAll(): Observable<ApiResult<UserDto[]>> {
    return this.http
      .get<ApiResult<UserDto[]>>(`${this.baseUrl}/api/users`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto[]>)));
  }

  getById(id: string): Observable<ApiResult<UserDto>> {
    return this.http
      .get<ApiResult<UserDto>>(`${this.baseUrl}/api/users/${id}`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto>)));
  }

  update(id: string, request: UpdateUserRequest): Observable<ApiResult<UserDto>> {
    return this.http
      .put<ApiResult<UserDto>>(`${this.baseUrl}/api/users/${id}`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto>)));
  }

  delete(id: string): Observable<ApiResult> {
    return this.http
      .delete<ApiResult>(`${this.baseUrl}/api/users/${id}`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult)));
  }

  searchByEmail(email: string): Observable<ApiResult<UserDto[]>> {
    const params = new HttpParams().set('email', email);

    return this.http
      .get<ApiResult<UserDto[]>>(`${this.baseUrl}/api/users/search`, { params })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto[]>)));
  }

  checkEmail(email: string): Observable<CheckEmailResponse> {
    const params = new HttpParams().set('email', email);

    return this.http
      .get<CheckEmailResponse>(`${this.baseUrl}/api/users/check-email`, { params })
      .pipe(
        catchError(() =>
          of({
            exists: false,
            message: 'Não foi possível verificar o email'
          })
        )
      );
  }
}

