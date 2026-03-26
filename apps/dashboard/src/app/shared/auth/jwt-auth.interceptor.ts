import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuthRefreshService } from './auth-refresh.service';
import { AuthSessionService } from './auth-session.service';

@Injectable()
export class JwtAuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authSession: AuthSessionService,
    @Inject(AuthRefreshService)
    private readonly authRefresh: AuthRefreshService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = req.url.startsWith(environment.apiUrl);
    const isRefreshRequest = req.url.includes('/api/auth/refresh-token');

    if (!isApiRequest || isRefreshRequest) {
      return next.handle(req);
    }

    return this.authRefresh.refreshIfNeeded().pipe(
      switchMap((refreshedToken) => {
        const token = refreshedToken ?? this.authSession.getToken();

        if (!token) {
          return next.handle(req);
        }

        const authorizedRequest = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });

        return next.handle(authorizedRequest).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 401) {
              // Token may have just expired — force refresh and retry once
              return this.authRefresh.forceRefresh().pipe(
                switchMap((newToken) => {
                  if (!newToken) {
                    return throwError(() => err);
                  }
                  const retryReq = req.clone({
                    setHeaders: { Authorization: `Bearer ${newToken}` }
                  });
                  return next.handle(retryReq);
                })
              );
            }
            return throwError(() => err);
          })
        );
      })
    );
  }
}