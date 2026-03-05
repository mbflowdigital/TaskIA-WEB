import { Injectable } from '@angular/core';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role?: string;
  requiresOnboarding?: boolean;
}

const STORAGE_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {

  setUser(user: AuthUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  getUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    return this.getUser()?.userId ?? null;
  }

  getRole(): string {
    return this.getUser()?.role ?? 'USER';
  }

  requiresOnboarding(): boolean {
    return this.getUser()?.requiresOnboarding === true;
  }

  clearOnboardingFlag(): void {
    const user = this.getUser();
    if (user) {
      user.requiresOnboarding = false;
      this.setUser(user);
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }
}
