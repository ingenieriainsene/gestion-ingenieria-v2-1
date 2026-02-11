import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Producto } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private endpoint = 'productos';

  constructor(private api: ApiService) {}

  getAll(): Observable<Producto[]> {
    return this.api.get<Producto[]>(this.endpoint);
  }

  getById(id: number): Observable<Producto> {
    return this.api.get<Producto>(`${this.endpoint}/${id}`);
  }

  create(data: Producto): Observable<Producto> {
    return this.api.post<Producto>(this.endpoint, data);
  }

  update(id: number, data: Producto): Observable<Producto> {
    return this.api.put<Producto>(`${this.endpoint}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
