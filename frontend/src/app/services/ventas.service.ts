import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tramite, TramiteService } from './domain.services';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private ventasSubject = new BehaviorSubject<Tramite[]>([]);
  ventas$: Observable<Tramite[]> = this.ventasSubject.asObservable();

  constructor(private tramites: TramiteService) { }

  /**
   * Carga ventas pendientes de un contrato concreto (ficha de contrato).
   */
  cargarVentasDesdeBackend(idContrato?: number) {
    if (idContrato) {
      this.tramites.getByContrato(idContrato).subscribe(lista => {
        const ventas = lista.filter(t => t.estado === 'Pendiente');
        this.ventasSubject.next(ventas);
      });
    }
  }

  /**
   * Carga todas las ventas pendientes desde GET /api/tramites/ventas-pendientes.
   * Usar en la página /ventas o al abrir el sidebar.
   */
  cargarTodasVentasPendientes() {
    this.tramites.getVentasPendientes().subscribe(ventas => {
      this.ventasSubject.next(ventas || []);
    });
  }

  agregarVenta(tramite: Tramite) {
    const actuales = this.ventasSubject.value;
    if (!actuales.find(t => t.idTramite === tramite.idTramite)) {
      this.ventasSubject.next([...actuales, tramite]);
    }
  }

  quitarVenta(idTramite: number) {
    this.ventasSubject.next(
      this.ventasSubject.value.filter(t => t.idTramite !== idTramite)
    );
  }
}

