import { Routes } from '@angular/router';
import { ProveedorListComponent } from './features/proveedores/proveedor-list.component';
import { ProveedorFichaComponent } from './features/proveedores/proveedor-ficha.component';
import { ProveedorFichaViewComponent } from './features/proveedores/proveedor-ficha-view.component';
import { ClienteListComponent } from './features/clientes/cliente-list.component';
import { ClienteFichaComponent } from './features/clientes/cliente-ficha.component';
import { ClienteFichaViewComponent } from './features/clientes/cliente-ficha-view.component';
import { LocalListComponent } from './features/locales/local-list.component';
import { LocalFichaComponent } from './features/locales/local-ficha.component';
import { LocalFichaViewComponent } from './features/locales/local-ficha-view.component';
import { ContratoListComponent } from './features/contratos/contrato-list.component';
import { ContratoFichaComponent } from './features/contratos/contrato-ficha.component';
import { ContratoFichaViewComponent } from './features/contratos/contrato-ficha-view.component';
import { TramiteListComponent } from './features/tramites/tramite-list.component';
import { GestionIntervencionComponent } from './features/tramites/gestion-intervencion.component';
import { TramiteDetalleComponent } from './features/tramites/tramite-detalle.component';
import { LoginComponent } from './features/auth/login.component';
import { authGuard } from './core/auth.guard';
import { UsuarioListComponent } from './features/usuarios/usuario-list.component';
import { UsuarioFichaComponent } from './features/usuarios/usuario-ficha.component';
import { AuditoriaComponent } from './features/auditoria/auditoria.component';
import { PresupuestoListComponent } from './features/presupuestos/presupuesto-list.component';
import { PresupuestoFormComponent } from './features/presupuestos/presupuesto-form.component';
import { PresupuestoFichaViewComponent } from './features/presupuestos/presupuesto-ficha-view.component';
import { ProductoListComponent } from './features/productos/producto-list.component';
import { ProductoFormComponent } from './features/productos/producto-form.component';
import { SeguimientoListComponent } from './features/seguimientos/seguimiento-list.component';
import { PlanificacionIntervencionesComponent } from './features/contratos/planificacion-intervenciones.component';

import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'clientes', pathMatch: 'full' },
            { path: 'proveedores', component: ProveedorListComponent },
            { path: 'proveedores/nuevo', component: ProveedorFichaComponent },
            { path: 'proveedores/:id/editar', component: ProveedorFichaComponent },
            { path: 'proveedores/:id', component: ProveedorFichaViewComponent },

            { path: 'productos', component: ProductoListComponent },
            { path: 'productos/nuevo', component: ProductoFormComponent },
            { path: 'productos/:id', component: ProductoFormComponent },

            { path: 'clientes', component: ClienteListComponent },
            { path: 'clientes/nuevo', component: ClienteFichaComponent },
            { path: 'clientes/:id/editar', component: ClienteFichaComponent },
            { path: 'clientes/:id', component: ClienteFichaViewComponent },

            { path: 'locales', component: LocalListComponent },
            { path: 'locales/nuevo', component: LocalFichaComponent },
            { path: 'locales/:id/editar', component: LocalFichaComponent },
            { path: 'locales/:id', component: LocalFichaViewComponent },

            { path: 'contratos', component: ContratoListComponent },
            { path: 'contratos/nuevo', component: ContratoFichaComponent },
            { path: 'contratos/:id/editar', component: ContratoFichaComponent },
            { path: 'contratos/:id', component: ContratoFichaViewComponent },

            // Nested or Related Tramites Routes
            { path: 'contratos/:idContrato/tramites', component: TramiteListComponent },
            { path: 'contratos/:idContrato/tramites/:idTramite', component: GestionIntervencionComponent },
            { path: 'tramite-detalle/:id', component: TramiteDetalleComponent },
            { path: 'contratos/:id/planificacion', component: PlanificacionIntervencionesComponent },

            { path: 'usuarios', component: UsuarioListComponent, canActivate: [adminGuard] },
            { path: 'usuarios/nuevo', component: UsuarioFichaComponent, canActivate: [adminGuard] },
            { path: 'usuarios/:id', component: UsuarioFichaComponent, canActivate: [adminGuard] },

            { path: 'auditoria', component: AuditoriaComponent, canActivate: [adminGuard] },
            { path: 'seguimientos', component: SeguimientoListComponent },
            { path: 'intervenciones', loadComponent: () => import('./features/tramites/intervencion-list.component').then(m => m.IntervencionListComponent) },
            { path: 'agendar-citas', loadComponent: () => import('./features/citas/agendar-citas.component').then(m => m.AgendarCitasComponent) },
            { path: 'chat', loadComponent: () => import('./features/chat/chat-general.component').then(m => m.ChatGeneralComponent) },

            { path: 'presupuestos', component: PresupuestoListComponent },
            { path: 'presupuestos/nuevo', component: PresupuestoFormComponent },
            { path: 'presupuestos/:id/editar', component: PresupuestoFormComponent },
            { path: 'presupuestos/:id', component: PresupuestoFichaViewComponent },
        ]
    }
];
