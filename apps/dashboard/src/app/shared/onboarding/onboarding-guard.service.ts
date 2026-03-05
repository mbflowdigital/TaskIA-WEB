import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { AuthSessionService } from '../auth/auth-session.service';
import { OnboardingService } from './onboarding.service';

@Injectable({ providedIn: 'root' })
export class OnboardingGuard implements CanActivateChild {
  constructor(
    private readonly authSession: AuthSessionService,
    private readonly onboarding: OnboardingService,
    private readonly router: Router
  ) {}

  canActivateChild(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (state.url.startsWith('/onboarding/company')) return true;

    const user = this.authSession.getUser();
    if (!user) return true;

    // Só aplica onboarding para admins.
    if (!this.onboarding.isAdminMock(user)) return true;

    // Já completou? segue normal.
    if (this.onboarding.isCompanyOnboardingCompleted(user.userId)) return true;

    // Não completou: força onboarding.
    return this.router.parseUrl('/onboarding/company');
  }
}
