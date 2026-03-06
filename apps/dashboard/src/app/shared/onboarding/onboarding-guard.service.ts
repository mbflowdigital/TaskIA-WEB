import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { AuthSessionService } from '../auth/auth-session.service';

@Injectable({ providedIn: 'root' })
export class OnboardingGuard implements CanActivateChild {
  constructor(
    private readonly authSession: AuthSessionService,
    private readonly router: Router
  ) {}

  canActivateChild(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Deixa as rotas de onboarding passarem livremente
    if (state.url.startsWith('/onboarding')) return true;

    const user = this.authSession.getUser();
    if (!user) return true;

    if (this.authSession.requiresOnboarding()) {
      return this.router.parseUrl('/onboarding');
    }

    return true;
  }
}
