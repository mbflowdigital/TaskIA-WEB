import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';

export interface BoardTaskDto {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  prazoEmDias: number;
  ordemNoBoard: number;
  responsavelId?: string;
  responsavelName?: string;
  sugestaoResponsavelId?: string;
  sugestaoResponsavelName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBoardTaskRequest {
  projectId: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  prazoEmDias: number;
  ordemNoBoard: number;
  responsavelId?: string;
  sugestaoResponsavelId?: string;
}

export interface UpdateBoardStatusRequest {
  status: string;
}

export interface AssignResponsavelRequest {
  responsavelId: string | null;
}

export interface UpdateBoardOrdemRequest {
  ordemNoBoard: number;
}

export type BoardStatus = 'A Fazer' | 'Em Andamento' | 'Concluído';
export const BOARD_STATUSES: BoardStatus[] = ['A Fazer', 'Em Andamento', 'Concluído'];

@Injectable({ providedIn: 'root' })
export class BoardApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getByProject(projectId: string): Observable<ApiResult<BoardTaskDto[]>> {
    return this.http
      .get<ApiResult<BoardTaskDto[]>>(`${this.baseUrl}/api/Board/project/${projectId}`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<BoardTaskDto[]>)));
  }

  updateStatus(id: string, status: string): Observable<ApiResult<BoardTaskDto>> {
    return this.http
      .put<ApiResult<BoardTaskDto>>(`${this.baseUrl}/api/Board/${id}/status`, { status })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<BoardTaskDto>)));
  }

  assignResponsavel(id: string, responsavelId: string | null): Observable<ApiResult<BoardTaskDto>> {
    return this.http
      .put<ApiResult<BoardTaskDto>>(`${this.baseUrl}/api/Board/${id}/assign-responsavel`, { responsavelId })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<BoardTaskDto>)));
  }

  updateOrdem(id: string, ordemNoBoard: number): Observable<ApiResult<BoardTaskDto>> {
    return this.http
      .put<ApiResult<BoardTaskDto>>(`${this.baseUrl}/api/Board/${id}/ordem`, { ordemNoBoard })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<BoardTaskDto>)));
  }

  updatePrazo(id: string, prazoEmDias: number): Observable<ApiResult<BoardTaskDto>> {
    return this.http
      .put<ApiResult<BoardTaskDto>>(`${this.baseUrl}/api/Board/${id}/prazo`, { prazoEmDias })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<BoardTaskDto>)));
  }

  getStatistics(projectId: string): Observable<ApiResult<unknown>> {
    return this.http
      .get<ApiResult<unknown>>(`${this.baseUrl}/api/Board/project/${projectId}/statistics`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<unknown>)));
  }
}
