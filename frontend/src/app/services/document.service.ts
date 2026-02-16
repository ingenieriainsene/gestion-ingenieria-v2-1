import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface CrmDocument {
    id: string; // UUID
    referenceId: number;
    entityType: string;
    fileNameOriginal: string;
    fileNameSystem: string;
    fileType: string;
    size: number;
    uploadedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class DocumentService {

    private apiUrl = `${environment.apiUrl}/documents`;

    constructor(private http: HttpClient) { }

    upload(files: File[], referenceId: number, entityType: string): Observable<CrmDocument[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('referenceId', referenceId.toString());
        formData.append('entityType', entityType);

        return this.http.post<CrmDocument[]>(`${this.apiUrl}/upload`, formData);
    }

    getLocation(): Observable<string> {
        return this.http.get(`${this.apiUrl}/location`, { responseType: 'text' });
    }

    list(entityType: string, referenceId: number): Observable<CrmDocument[]> {
        return this.http.get<CrmDocument[]>(`${this.apiUrl}/list/${entityType}/${referenceId}`);
    }

    downloadUrl(id: string): string {
        return `${this.apiUrl}/download/${id}`;
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
