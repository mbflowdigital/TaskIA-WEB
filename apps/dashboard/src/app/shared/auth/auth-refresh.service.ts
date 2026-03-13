import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { LoginApiResult } from '../api/auth/auth.types';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthRefreshService {
  private readonly http: HttpClient;
  private refreshRequest$?: Observable<string | null>;
  private readonly refreshThresholdMs = 120000;
  private refreshMonitorId?: number;

  constructor(
    httpBackend: HttpBackend,
    private readonly authSession: AuthSessionService,
    private readonly router: Router
  ) {
    this.http = new HttpClient(httpBackend);
  }

  initializeMonitoring(): void {
    if (this.refreshMonitorId) {
      return;
    }

    this.runRefreshCheck();
    this.refreshMonitorId = window.setInterval(() => {
      this.runRefreshCheck();
    }, 30000);
  }

  refreshIfNeeded(): Observable<string | null> {
    const currentToken = this.authSession.getToken();

    if (!currentToken) {
      return of(null);
    }

    if (!this.authSession.isTokenExpiringSoon(this.refreshThresholdMs)) {
      return of(currentToken);
    }

    return this.refreshToken();
  }

  private runRefreshCheck(): void {
    const token = this.authSession.getToken();

    if (!token || this.refreshRequest$) {
      return;
    }

    if (!this.authSession.isTokenExpiringSoon(this.refreshThresholdMs)) {
      return;
    }

    this.refreshToken().subscribe();
  }

  private refreshToken(): Observable<string | null> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const token = this.authSession.getToken();
    const refreshToken = this.authSession.getRefreshToken();

    if (!token || !refreshToken) {
      this.handleRefreshFailure();
      return of(null);
    }

    this.refreshRequest$ = this.http
      .post<LoginApiResult>(`${environment.apiUrl}/api/auth/refresh-token`, {
        token,
        refreshToken
      })
      .pipe(
        tap((result) => {
          if (!result?.isSuccess || !result.data?.token) {
            throw new Error(result?.message ?? 'Não foi possível renovar a sessão.');
          }
        }),
        map((result) => {
          const data = result.data!;
          this.authSession.updateTokens(data.token, data.refreshToken, data.tokenExpiration);
          return data.token;
        }),
        catchError(() => {
          this.handleRefreshFailure();
          return of(null);
        }),
        finalize(() => {
          this.refreshRequest$ = undefined;
        }),
        shareReplay(1)
      );

    return this.refreshRequest$;
  }

  private handleRefreshFailure(): void {
    this.authSession.clear();
    void this.router.navigate(['/pages/login']);
  }
}