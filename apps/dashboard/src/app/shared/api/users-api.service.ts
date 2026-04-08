import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';
import { CheckEmailResponse, CreateUserRequest, UpdateUserRequest, UserDto, ViaCepDto, ProfileImageDto } from 'app/shared/api/users/users.types';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';

@Injectable({
  providedIn: 'root'
})
export class UsersApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly authSession: AuthSessionService
  ) {}

  private getActorHeaders(): HttpHeaders {
    const user = this.authSession.getUser();
    let headers = new HttpHeaders();

    if (user?.userId) {
      headers = headers.set('X-User-Id', user.userId);
    }

    if (user?.role) {
      headers = headers.set('X-User-Role', user.role);
    }

    return headers;
  }

  create(request: CreateUserRequest): Observable<ApiResult<UserDto>> {
    return this.http
      .post<ApiResult<UserDto>>(`${this.baseUrl}/api/users`, request, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto>)));
  }

  getAll(): Observable<ApiResult<UserDto[]>> {
    return this.http
      .get<ApiResult<UserDto[]>>(`${this.baseUrl}/api/users`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto[]>)));
  }

  getById(id: string): Observable<ApiResult<UserDto>> {
    return this.http
      .get<ApiResult<UserDto>>(`${this.baseUrl}/api/users/${id}`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto>)));
  }

  update(id: string, request: UpdateUserRequest): Observable<ApiResult<UserDto>> {
    return this.http
      .put<ApiResult<UserDto>>(`${this.baseUrl}/api/users/${id}`, request, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto>)));
  }

  delete(id: string): Observable<ApiResult> {
    return this.http
      .delete<ApiResult>(`${this.baseUrl}/api/users/${id}`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult)));
  }

  searchByEmail(email: string): Observable<ApiResult<UserDto[]>> {
    const params = new HttpParams().set('email', email);

    return this.http
      .get<ApiResult<UserDto[]>>(`${this.baseUrl}/api/users/search`, {
        params,
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<UserDto[]>)));
  }

  checkEmail(email: string): Observable<CheckEmailResponse> {
    const params = new HttpParams().set('email', email);

    return this.http
      .get<CheckEmailResponse>(`${this.baseUrl}/api/users/check-email`, { params })
      .pipe(
        catchError(() =>
          of({
            exists: false,
            message: 'Não foi possível verificar o email'
          })
        )
      );
  }

  getAddressByCep(cep: string): Observable<ApiResult<ViaCepDto>> {
    return this.http
      .get<ApiResult<ViaCepDto>>(`${this.baseUrl}/api/users/cep/${cep}`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ViaCepDto>)));
  }

  // ── Profile Image ────────────────────────────────────────────────────────

  /**
   * Faz upload da imagem de perfil do usuário
   * @param userId ID do usuário
   * @param file Arquivo de imagem
   */
  uploadProfileImage(userId: string, file: File): Observable<ApiResult<ProfileImageDto>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiResult<ProfileImageDto>>(`${this.baseUrl}/api/Users/${userId}/profile-image`, formData, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ProfileImageDto>)));
  }

  /**
   * Obtém a URL da imagem de perfil do usuário
   * @param userId ID do usuário
   * @returns URL da imagem para usar em <img src="">
   */
  getProfileImageUrl(userId: string): string {
    return `${this.baseUrl}/api/Users/${userId}/profile-image`;
  }

  /**
   * Obtém a imagem de perfil do usuário como Blob
   * @param userId ID do usuário
   */
  getProfileImageBlob(userId: string): Observable<Blob> {
    return this.http
      .get(`${this.baseUrl}/api/Users/${userId}/profile-image`, {
        headers: this.getActorHeaders(),
        responseType: 'blob'
      })
      .pipe(
        catchError(() => {
          // Retorna um blob vazio em caso de erro
          return of(new Blob());
        })
      );
  }

  /**
   * Remove a imagem de perfil do usuário
   * @param userId ID do usuário
   */
  deleteProfileImage(userId: string): Observable<ApiResult> {
    return this.http
      .delete<ApiResult>(`${this.baseUrl}/api/Users/${userId}/profile-image`, {
        headers: this.getActorHeaders()
      })
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult)));
  }
}

