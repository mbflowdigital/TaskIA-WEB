import { Injectable } from '@angular/core';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
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

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }
}
