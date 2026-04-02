import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResult } from 'app/shared/api/shared/api-result.types';

export interface ExtractedTextResponse {
  extractedText: string;
  fileName: string;
  fileSize: number;
  fileExtension: string;
  characterCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /**
   * Extrai texto de um arquivo (PDF, Word, Excel, TXT).
   * Limite: 10MB
   */
  extractText(file: File): Observable<ApiResult<ExtractedTextResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiResult<ExtractedTextResponse>>(`${this.baseUrl}/api/documents/extrair-texto`, formData)
      .pipe(catchError((err: HttpErrorResponse) => of(err.error as ApiResult<ExtractedTextResponse>)));
  }
}
