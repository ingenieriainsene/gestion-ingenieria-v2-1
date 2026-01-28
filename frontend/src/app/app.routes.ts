import { Routes } from '@angular/router';
import { ProveedorListComponent } from './features/proveedores/proveedor-list.component';
import { ProveedorFichaComponent } from './features/proveedores/proveedor-ficha.component';
import { ClienteListComponent } from './features/clientes/cliente-list.component';
import { ClienteFichaComponent } from './features/clientes/cliente-ficha.component';
import { LocalListComponent } from './features/locales/local-list.component';
import { LocalFichaComponent } from './features/locales/local-ficha.component';
import { ContratoListComponent } from './features/contratos/contrato-list.component';
import { ContratoFichaComponent } from './features/contratos/contrato-ficha.component';
import { TramiteListComponent } from './features/tramites/tramite-list.component';
import { GestionIntervencionComponent } from './features/tramites/gestion-intervencion.component';
import { TramiteDetalleComponent } from './features/tramites/tramite-detalle.component';
import { LoginComponent } from './features/auth/login.component';
import { authGuard } from './core/auth.guard';
import { UsuarioListComponent } from './features/usuarios/usuario-list.component';
import { UsuarioFichaComponent } from './features/usuarios/usuario-ficha.component';
import { AuditoriaComponent } from './features/auditoria/auditoria.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'proveedores', pathMatch: 'full' },
            { path: 'proveedores', component: ProveedorListComponent },
            { path: 'proveedores/nuevo', component: ProveedorFichaComponent },
            { path: 'proveedores/:id', component: ProveedorFichaComponent },

            { path: 'clientes', component: ClienteListComponent },
            { path: 'clientes/nuevo', component: ClienteFichaComponent },
            { path: 'clientes/:id', component: ClienteFichaComponent },

            { path: 'locales', component: LocalListComponent },
            { path: 'locales/nuevo', component: LocalFichaComponent },
            { path: 'locales/:id', component: LocalFichaComponent },

            { path: 'contratos', component: ContratoListComponent },
            { path: 'contratos/nuevo', component: ContratoFichaComponent },
            { path: 'contratos/:id', component: ContratoFichaComponent },

            // Nested or Related Tramites Routes
            { path: 'contratos/:idContrato/tramites', component: TramiteListComponent },
            { path: 'contratos/:idContrato/tramites/:idTramite', component: GestionIntervencionComponent },
            { path: 'tramite-detalle/:id', component: TramiteDetalleComponent },

            { path: 'usuarios', component: UsuarioListComponent },
            { path: 'usuarios/nuevo', component: UsuarioFichaComponent },
            { path: 'usuarios/:id', component: UsuarioFichaComponent },

            { path: 'auditoria', component: AuditoriaComponent },
        ]
    }
];
