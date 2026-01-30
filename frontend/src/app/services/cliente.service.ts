import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ClienteDTO {
    id?: number;
    nombre: string;
    email: string;
    empresa?: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
    private endpoint = 'clientes';

    constructor(private api: ApiService) {}

    listar(): Observable<ClienteDTO[]> {
        return this.api.get<ClienteDTO[]>(this.endpoint);
    }
}
