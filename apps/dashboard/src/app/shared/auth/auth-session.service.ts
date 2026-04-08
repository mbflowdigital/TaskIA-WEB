import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { LoginData } from '../api/auth/auth.types';

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
const REFRESH_TOKEN_STORAGE_KEY = 'auth_refresh_token';
const TOKEN_EXPIRATION_STORAGE_KEY = 'auth_token_expiration';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {

  private readonly _avatarUrl$ = new BehaviorSubject<string | null>(null);
  readonly avatarUrl$ = this._avatarUrl$.asObservable();

  private readonly _userName$ = new BehaviorSubject<string>('');
  readonly userName$ = this._userName$.asObservable();

  private avatarKey(userId: string): string { return `profile-photo-${userId}`; }

  /** Emit novo avatar para todos os subscribers (navbar, etc.) */
  setAvatar(userId: string, dataUrl: string | null): void {
    if (dataUrl) {
      localStorage.setItem(this.avatarKey(userId), dataUrl);
    } else {
      localStorage.removeItem(this.avatarKey(userId));
    }
    this._avatarUrl$.next(dataUrl);
  }

  /** Carrega avatar do localStorage e emite */
  loadAvatar(userId: string): void {
    const stored = localStorage.getItem(this.avatarKey(userId));
    this._avatarUrl$.next(stored);
  }

  /** Emite o nome atual da sessão sem reescrever no localStorage */
  loadUserName(): void {
    const name = this.getUser()?.name?.trim() || '';
    this._userName$.next(name);
  }

  setSession(data: LoginData): void {
    this.setUser({
      userId: data.userId,
      companyId: data.companyId,
      companyName: data.companyName ?? undefined,
      name: data.name,
      email: data.email,
      cpf: data.cpf,
      phone: data.phone,
      role: data.role,
      requiresOnboarding: data.requiresOnboarding ?? false
    });

    this.setStoredValue(TOKEN_STORAGE_KEY, data.token);
    this.setStoredValue(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
    this.setStoredValue(TOKEN_EXPIRATION_STORAGE_KEY, data.tokenExpiration);
  }

  setUser(user: AuthUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this._userName$.next(user.name?.trim() || '');
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

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  getTokenExpiration(): Date | null {
    const rawValue = localStorage.getItem(TOKEN_EXPIRATION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const expiration = new Date(rawValue);
    return Number.isNaN(expiration.getTime()) ? null : expiration;
  }

  updateTokens(token: string | null, refreshToken: string | null, tokenExpiration: string | null): void {
    this.setStoredValue(TOKEN_STORAGE_KEY, token);
    this.setStoredValue(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    this.setStoredValue(TOKEN_EXPIRATION_STORAGE_KEY, tokenExpiration);
  }

  isTokenExpiringSoon(thresholdMs = 120000): boolean {
    const token = this.getToken();
    const expiration = this.getTokenExpiration();

    if (!token || !expiration) {
      return false;
    }

    return expiration.getTime() - Date.now() <= thresholdMs;
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
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRATION_STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getUser() && !!this.getToken();
  }

  private setStoredValue(key: string, value: string | null | undefined): void {
    if (value) {
      localStorage.setItem(key, value);
      return;
    }

    localStorage.removeItem(key);
  }
}
