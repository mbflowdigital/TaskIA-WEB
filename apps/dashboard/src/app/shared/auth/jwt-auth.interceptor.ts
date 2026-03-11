import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });

        return next.handle(authorizedRequest);
      })
    );
  }
}