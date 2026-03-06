import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';

/**
 * Impede acesso ao dashboard enquanto o ADM não completar o onboarding.
 * Se o usuário tiver `requiresOnboarding = true` redireciona para /onboarding.
 * Se não estiver logado redireciona para /pages/login.
 */
export const onboardingGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  if (!authSession.isLoggedIn()) {
    return router.createUrlTree(['/pages/login']);
  }

  if (authSession.requiresOnboarding()) {
    return router.createUrlTree(['/onboarding']);
  }

  return true;
};
