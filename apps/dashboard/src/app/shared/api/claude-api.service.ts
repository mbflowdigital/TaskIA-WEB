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

export interface TeamMemberAnalysis {
  userId: string;
  userName: string;
  role: string;
  dedication: string;
  isApprover: boolean;
}

export interface ProjectAnalysisRequest {
  projectName: string;
  objective: string;
  startDate: string;
  endDate?: string;
  description?: string;
  company: string;
  department: string;
  projectType: string;
  teamMembers: TeamMemberAnalysis[];
}

export interface ProjectAnalysisResult {
  overview: string;
  risks: string;
  recommendations: string;
}

/** Serviço para chamadas à Claude AI API */
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

  analyzeProject(payload: ProjectAnalysisRequest): Observable<ApiResult<ProjectAnalysisResult>> {
    return this.http
      .post<ApiResult<ProjectAnalysisResult>>(`${this.baseUrl}/api/claude/analyze-project`, payload)
      .pipe(
        catchError((err: HttpErrorResponse) =>
          of(err.error as ApiResult<ProjectAnalysisResult>)
        )
      );
  }
}
