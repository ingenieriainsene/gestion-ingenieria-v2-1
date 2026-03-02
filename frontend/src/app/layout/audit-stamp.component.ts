import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-audit-stamp',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="user-stamp" *ngIf="data">
      <div class="stamp-column">
        <div class="stamp-item">
          <span class="stamp-label">Creado por:</span>
          <strong>{{ data.creadoPor || data.nombreCreador || 'Sistema' }}</strong>
        </div>
        <div class="stamp-item">
          <span class="stamp-label">Fecha registro:</span>
          <span>{{ (data.fechaAlta || data.fechaCreacion || data.fechaRegistro) | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>
      <div class="stamp-divider" *ngIf="data.modificadoPor || data.fechaModificacion"></div>
      <div class="stamp-column" *ngIf="data.modificadoPor || data.fechaModificacion">
        <div class="stamp-item">
          <span class="stamp-label">Modificado por:</span>
          <strong>{{ data.modificadoPor || 'Sistema' }}</strong>
        </div>
        <div class="stamp-item">
          <span class="stamp-label">Ult. Modificación:</span>
          <span>{{ data.fechaModificacion | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .user-stamp {
      display: flex;
      align-items: center;
      gap: 15px;
      text-align: right;
      font-size: 0.7rem;
      color: #64748b;
      background: #ffffff;
      padding: 8px 15px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      float: right;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .stamp-column {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stamp-divider {
      width: 1px;
      height: 25px;
      background: #e2e8f0;
    }
    .stamp-item {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      line-height: 1.2;
    }
    .stamp-label {
      color: #94a3b8;
      font-weight: 500;
      text-transform: uppercase;
      font-size: 0.6rem;
      letter-spacing: 0.3px;
    }
    strong {
      color: #1e293b;
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .user-stamp {
        float: none;
        width: 100%;
        box-sizing: border-box;
        text-align: left;
        justify-content: space-between;
        flex-wrap: wrap;
        margin: 0 0 12px 0;
      }

      .stamp-item {
        justify-content: flex-start;
      }
    }
  `]
})
export class AuditStampComponent {
    @Input() data: any;
}
