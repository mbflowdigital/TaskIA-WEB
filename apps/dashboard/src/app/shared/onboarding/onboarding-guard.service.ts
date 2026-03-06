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
    // Deixa as rotas de onboarding passarem livremente
    if (state.url.startsWith('/onboarding')) return true;

    const user = this.authSession.getUser();
    if (!user) return true;

    // ── Nova lógica: flag do backend (ADM sem empresa vinculada) ──
    if (this.authSession.requiresOnboarding()) {
      return this.router.parseUrl('/onboarding');
    }

    // ── Lógica legada: localStorage para fluxo de empresa (ADM_MASTER) ──
    // Aplica apenas para ADM_MASTER; ADM usa o novo fluxo acima.
    if (user.role === 'ADM_MASTER' && !this.onboarding.isCompanyOnboardingCompleted(user.userId)) {
      return this.router.parseUrl('/onboarding/company');
    }

    return true;
  }
}
