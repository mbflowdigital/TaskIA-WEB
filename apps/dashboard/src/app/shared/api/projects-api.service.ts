import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';
import { CreateProjectRequest, ProjectDto, UpdateProjectRequest } from 'app/shared/api/projects/projects.types';

@Injectable({
  providedIn: 'root'
})
export class ProjectsApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAll(userId?: string): Observable<ApiResult<ProjectDto[]>> {
    return this.http
      .get<ApiResult<ProjectDto[]>>(`${this.baseUrl}/api/projects`)
      .pipe(
        map(result => {
          if (userId && result?.data?.length) {
            return { ...result, data: result.data.filter(p => p.userId === userId) };
          }
          return result;
        }),
        catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto[]>))
      );
  }

  getById(id: string): Observable<ApiResult<ProjectDto>> {
    return this.http
      .get<ApiResult<ProjectDto>>(`${this.baseUrl}/api/projects/${id}`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto>)));
  }

  create(request: CreateProjectRequest): Observable<ApiResult<ProjectDto>> {
    return this.http
      .post<ApiResult<ProjectDto>>(`${this.baseUrl}/api/projects`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto>)));
  }

  update(id: string, request: UpdateProjectRequest): Observable<ApiResult<ProjectDto>> {
    return this.http
      .put<ApiResult<ProjectDto>>(`${this.baseUrl}/api/projects/${id}`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto>)));
  }

  delete(id: string): Observable<ApiResult> {
    return this.http
      .delete<ApiResult>(`${this.baseUrl}/api/projects/${id}`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult)));
  }

  toggleStatus(id: string): Observable<ApiResult<ProjectDto>> {
    return this.http
      .patch<ApiResult<ProjectDto>>(`${this.baseUrl}/api/projects/${id}/status`, {})
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto>)));
  }
}
