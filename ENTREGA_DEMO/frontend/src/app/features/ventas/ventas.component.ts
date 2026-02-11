import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VentasService } from '../../services/ventas.service';
import { Tramite } from '../../services/domain.services';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ventas-sidebar" [class.open]="isOpen">
      <div class="sidebar-header">
        <h3>Ventas Pendientes</h3>
        <button (click)="toggle()">×</button>
      </div>
      <div class="sidebar-content">
        <div *ngIf="ventas.length === 0" class="empty-state">
           No hay ventas pendientes.
        </div>
        <div *ngFor="let venta of ventas" class="venta-card">
           <div class="venta-info">
             <span class="venta-tipo">{{ venta.tipoTramite }}</span>
             <small>Contrato #{{ venta.idContrato }}</small>
           </div>
           <a [routerLink]="['/contratos', venta.idContrato]" class="btn-go">Ir</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ventas-sidebar {
      position: fixed; top: 0; right: -320px; width: 320px; height: 100vh;
      background: white; border-left: 1px solid #e2e8f0; box-shadow: -5px 0 15px rgba(0,0,0,0.05);
      transition: 0.3s; z-index: 1000; display: flex; flex-direction: column;
    }
    .ventas-sidebar.open { right: 0; }
    .sidebar-header {
      padding: 15px; background: #1e293b; color: white; display: flex; justify-content: space-between; align-items: center;
    }
    .sidebar-header h3 { margin: 0; font-size: 1rem; }
    .sidebar-header button { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
    .sidebar-content { padding: 15px; overflow-y: auto; flex: 1; }
    .venta-card {
      background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;
      margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;
    }
    .venta-info { display: flex; flex-direction: column; }
    .venta-tipo { font-weight: bold; color: #1e293b; font-size: 0.9rem; }
    .btn-go {
      background: #f1c40f; color: #1e293b; padding: 5px 10px; border-radius: 5px;
      text-decoration: none; font-weight: bold; font-size: 0.8rem;
    }
    .empty-state { text-align: center; color: #94a3b8; margin-top: 20px; }
  `]
})
export class VentasComponent implements OnInit, OnDestroy {
  ventas: Tramite[] = [];
  isOpen = false;
  private sub: Subscription | null = null;

  constructor(public ventasService: VentasService) { }

  ngOnInit() {
    this.sub = this.ventasService.ventas$.subscribe(v => {
      this.ventas = v;
      if (v.length > 0) this.isOpen = true; // Auto-open if items
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }
}
