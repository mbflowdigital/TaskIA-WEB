import { Injectable } from '@angular/core';
import { AuthUser } from '../auth/auth-session.service';

export interface CompanyOnboardingData {
  companyName: string;
  department: string;
  employeeCount: number;
  addressZip: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
  createdAt: string;
}

export interface EmployeeOnboardingData {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private getCompletedKey(userId: string): string {
    return `company_onboarding_completed:${userId}`;
  }

  private getDataKey(userId: string): string {
    return `company_onboarding_data:${userId}`;
  }

  private getEmployeePendingKey(userId: string): string {
    return `employee_onboarding_pending:${userId}`;
  }

  private getEmployeeDataKey(userId: string): string {
    return `employee_onboarding_data:${userId}`;
  }

  isAdminMock(user: AuthUser): boolean {
    // Enquanto o backend não expõe roles/perfis, tratamos todo usuário logado como admin.
    // (Mantemos o nome do método para facilitar a troca quando o backend estiver pronto.)
    void user;
    return true;
  }

  isCompanyOnboardingCompleted(userId: string): boolean {
    return localStorage.getItem(this.getCompletedKey(userId)) === '1';
  }

  getCompanyOnboardingData(userId: string): CompanyOnboardingData | null {
    try {
      const raw = localStorage.getItem(this.getDataKey(userId));
      return raw ? (JSON.parse(raw) as CompanyOnboardingData) : null;
    } catch {
      return null;
    }
  }

  completeCompanyOnboarding(userId: string, data: Omit<CompanyOnboardingData, 'createdAt'>): void {
    const payload: CompanyOnboardingData = {
      ...data,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(this.getCompletedKey(userId), '1');
    localStorage.setItem(this.getDataKey(userId), JSON.stringify(payload));
  }

  startEmployeeOnboarding(userId: string): void {
    localStorage.setItem(this.getEmployeePendingKey(userId), '1');
  }

  isEmployeeOnboardingPending(userId: string): boolean {
    return localStorage.getItem(this.getEmployeePendingKey(userId)) === '1';
  }

  clearEmployeeOnboardingPending(userId: string): void {
    localStorage.removeItem(this.getEmployeePendingKey(userId));
  }

  getEmployeeOnboardingData(userId: string): EmployeeOnboardingData | null {
    try {
      const raw = localStorage.getItem(this.getEmployeeDataKey(userId));
      return raw ? (JSON.parse(raw) as EmployeeOnboardingData) : null;
    } catch {
      return null;
    }
  }

  completeEmployeeOnboarding(userId: string, data: Omit<EmployeeOnboardingData, 'createdAt'>): void {
    const payload: EmployeeOnboardingData = {
      ...data,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(this.getEmployeeDataKey(userId), JSON.stringify(payload));
    this.clearEmployeeOnboardingPending(userId);
  }
}
