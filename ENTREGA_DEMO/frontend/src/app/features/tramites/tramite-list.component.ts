import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TramiteService, Tramite } from '../../services/domain.services';

@Component({
    selector: 'app-tramite-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Trámites del Contrato {{ idContrato }}</h2>
      <a [routerLink]="['/contratos', idContrato, 'tramites', 'nuevo']" class="btn btn-primary">+ Nuevo Trámite</a>
    </div>
    <div class="list-group">
      <a *ngFor="let t of tramites" [routerLink]="['/contratos', idContrato, 'tramites', t.idTramite]" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
        <div>
           <h5 class="mb-1">{{ t.tipoTramite }}</h5>
           <p class="mb-1 text-muted">{{ t.detalleSeguimiento }}</p>
        </div>
        <span class="badge" [ngClass]="{'bg-success': t.estado === 'Terminado', 'bg-warning': t.estado === 'Pendiente'}">
            {{ t.estado }}
        </span>
      </a>
    </div>
    <div class="mt-3">
        <a routerLink="/contratos" class="btn btn-secondary">Volver a Contratos</a>
    </div>
  `
})
export class TramiteListComponent implements OnInit {
    tramites: Tramite[] = [];
    idContrato: number | null = null;

    constructor(private service: TramiteService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.idContrato = Number(params.get('idContrato'));
            if (this.idContrato) {
                this.service.getByContrato(this.idContrato).subscribe(data => this.tramites = data);
            }
        });
    }
}
