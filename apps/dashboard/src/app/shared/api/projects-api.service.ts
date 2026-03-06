import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';
import { CreateProjectRequest, ProjectDto, UpdateProjectRequest } from 'app/shared/api/projects/projects.types';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectsApiService {
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

  getAll(): Observable<ApiResult<ProjectDto[]>> {
    return this.http
      .get<ApiResult<ProjectDto[]>>(`${this.baseUrl}/api/projects`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto[]>)));
  }

  getById(id: string): Observable<ApiResult<ProjectDto>> {
    return this.http
      .get<ApiResult<ProjectDto>>(`${this.baseUrl}/api/projects/${id}`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto>)));
  }

  create(request: CreateProjectRequest): Observable<ApiResult<ProjectDto>> {
    return this.http
      .post<ApiResult<ProjectDto>>(`${this.baseUrl}/api/projects`, request, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto>)));
  }

  update(id: string, request: UpdateProjectRequest): Observable<ApiResult<ProjectDto>> {
    return this.http
      .put<ApiResult<ProjectDto>>(`${this.baseUrl}/api/projects/${id}`, request, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto>)));
  }

  delete(id: string): Observable<ApiResult> {
    return this.http
      .delete<ApiResult>(`${this.baseUrl}/api/projects/${id}`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult)));
  }

  toggleStatus(id: string): Observable<ApiResult<ProjectDto>> {
    return this.http
      .patch<ApiResult<ProjectDto>>(`${this.baseUrl}/api/projects/${id}/status`, {}, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProjectDto>)));
  }
}
