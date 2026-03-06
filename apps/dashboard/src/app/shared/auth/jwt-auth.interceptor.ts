import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthSessionService } from './auth-session.service';

@Injectable()
export class JwtAuthInterceptor implements HttpInterceptor {
  constructor(private readonly authSession: AuthSessionService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authSession.getToken();
    const isApiRequest = req.url.startsWith(environment.apiUrl);

    if (!token || !isApiRequest) {
      return next.handle(req);
    }

    const authorizedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next.handle(authorizedRequest);
  }
}