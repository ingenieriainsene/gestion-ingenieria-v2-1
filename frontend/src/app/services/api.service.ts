import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = environment.apiUrl;

  constructor(private http: HttpClient) { }

  get<T = any>(endpoint: string, params?: Record<string, string>): Observable<T> {
    const opts = params ? { params: new HttpParams({ fromObject: params }) } : {};
    return this.http.get<T>(`${this.url}/${endpoint}`, opts);
  }

  getBlob(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.url}/${endpoint}`, { responseType: 'blob' });
  }

  postBlob(endpoint: string, data: unknown): Observable<Blob> {
    return this.http.post(`${this.url}/${endpoint}`, data, { responseType: 'blob' });
  }

  post<T = any>(endpoint: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${this.url}/${endpoint}`, data);
  }

  put<T = any>(endpoint: string, data: unknown): Observable<T> {
    return this.http.put<T>(`${this.url}/${endpoint}`, data);
  }

  patch<T = any>(endpoint: string, data: unknown): Observable<T> {
    return this.http.patch<T>(`${this.url}/${endpoint}`, data);
  }

  delete<T = void>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.url}/${endpoint}`);
  }
}