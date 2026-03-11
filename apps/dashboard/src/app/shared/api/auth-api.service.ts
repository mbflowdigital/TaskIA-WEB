import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';
import {
  ChangePasswordFirstAccessRequest,
  LoginApiResult,
  LoginRequest,
  RefreshTokenRequest
} from 'app/shared/api/auth/auth.types';

export interface OnboardingRequest {
  userId: string;
  companyName: string;
  address: string;
  cnpj: string;
  numberOfMembers: number;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginApiResult> {
    return this.http
      .post<LoginApiResult>(`${this.baseUrl}/api/auth/login`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as LoginApiResult)));
  }

  changePasswordFirstAccess(
    request: ChangePasswordFirstAccessRequest
  ): Observable<ApiResult<null>> {
    return this.http
      .post<ApiResult<null>>(`${this.baseUrl}/api/auth/change-password-first-access`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<null>)));
  }

  onboarding(request: OnboardingRequest): Observable<LoginApiResult> {
    return this.http
      .post<LoginApiResult>(`${this.baseUrl}/api/auth/onboarding`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as LoginApiResult)));
  }

  refreshToken(request: RefreshTokenRequest): Observable<LoginApiResult> {
    return this.http
      .post<LoginApiResult>(`${this.baseUrl}/api/auth/refresh-token`, request)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as LoginApiResult)));
  }
}
