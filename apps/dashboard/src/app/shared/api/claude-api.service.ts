import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';

export interface ProjectSuggestion {
  description: string;
  objective: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClaudeApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  suggestProject(projectName: string): Observable<ApiResult<ProjectSuggestion>> {
    return this.http
      .post<ApiResult<ProjectSuggestion>>(`${this.baseUrl}/api/claude/suggest-project`, { projectName })
      .pipe(
        catchError((err: HttpErrorResponse) =>
          of(err.error as ApiResult<ProjectSuggestion>)
        )
      );
  }
}
