import { Injectable } from '@angular/core';

export interface AuthUser {
  userId: string;
  companyId?: string | null;
  companyName?: string | null;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role?: string;
  requiresOnboarding?: boolean;
}

const STORAGE_KEY = 'auth_user';
const TOKEN_STORAGE_KEY = 'auth_token';

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

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
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
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }
}
