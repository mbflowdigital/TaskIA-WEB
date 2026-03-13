import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';
import { PositionDto } from 'app/shared/api/positions/positions.types';

@Injectable({
  providedIn: 'root'
})
export class PositionsApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResult<PositionDto[]>> {
    return this.http
      .get<ApiResult<PositionDto[]>>(`${this.baseUrl}/api/users/positions`)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<PositionDto[]>)));
  }
}