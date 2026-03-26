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
  private readonly refreshThresholdMs = 5 * 60 * 1000; // 5 minutos antes de expirar
  private readonly proactiveRefreshIntervalMs = 30 * 60 * 1000; // 30 minutos
  private refreshMonitorId?: number;
  private lastRefreshTime = 0;

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

    this.lastRefreshTime = Date.now(); // Iniciar o contador
    this.runRefreshCheck();
    // Check a cada 60 segundos (mais frequente para capturar expiração iminente)
    this.refreshMonitorId = window.setInterval(() => {
      this.runRefreshCheck();
    }, 60000);
  }

  resetRefreshTimer(): void {
    this.lastRefreshTime = Date.now();
  }

  /** Force a token refresh regardless of expiry (used for 401 retry). */
  forceRefresh(): Observable<string | null> {
    return this.refreshToken();
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
    const now = Date.now();

    if (!token || this.refreshRequest$) {
      return;
    }

    // 1. Refresh reativo: quando token está perto de expirar (dentro de 2 minutos)
    if (this.authSession.isTokenExpiringSoon(this.refreshThresholdMs)) {
      this.refreshToken().subscribe();
      this.lastRefreshTime = now;
      return;
    }

    // 2. Refresh proativo: a cada 15 minutos, independente da expiração
    if (now - this.lastRefreshTime >= this.proactiveRefreshIntervalMs) {
      this.refreshToken().subscribe();
      this.lastRefreshTime = now;
      return;
    }
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
    this.stopMonitoring();
    void this.router.navigate(['/pages/login']);
  }

  stopMonitoring(): void {
    if (this.refreshMonitorId) {
      window.clearInterval(this.refreshMonitorId);
      this.refreshMonitorId = undefined;
    }
  }
}