import { Component, EventEmitter, Output, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificacionService, Notificacion } from '../services/notificacion.service';
import { Subscription, interval, of } from 'rxjs';
import { startWith, switchMap, catchError } from 'rxjs/operators';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

interface NavCategory {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar" [class.collapsed]="collapsed" *ngIf="auth.isLoggedIn()">
      <div class="sidebar-header">
        <div class="toggle-btn" (click)="toggleSidebar()">
          &#9776;
        </div>
        <div class="nav-brand-container">
          <a class="nav-brand" routerLink="/">
            <img src="assets/logo-insene.png" alt="Insene Energía" class="brand-logo">
          </a>
        </div>
      </div>

      <nav class="sidebar-main">
        <ng-container *ngFor="let category of categories">
          <div class="nav-category" *ngIf="canViewCategory(category.id)">
            <div class="category-header" (click)="toggleCategory(category.id)">
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-label">{{ category.label }}</span>
              <span class="category-arrow" [class.expanded]="expandedCategories[category.id]">
                ❯
              </span>
            </div>
            
            <div class="category-items" [class.expanded]="expandedCategories[category.id]">
              <a
                *ngFor="let item of category.items"
                class="side-item"
                [routerLink]="item.route"
                routerLinkActive="active"
              >
                <span class="item-icon">{{ item.icon }}</span>
                <span class="item-label">{{ item.label }}</span>
              </a>
            </div>
          </div>
        </ng-container>
      </nav>

      <div class="sidebar-footer">
        <!-- Notificaciones cerca del perfil -->
        <div class="notif-section" [class.notif-collapsed]="collapsed">
          <div class="notif-bell-container" (click)="toggleNotifDropdown($event)">
            <div class="bell-circle">
              <span class="bell-emoji">🔔</span>
              <span *ngIf="noLeidas.length > 0" class="notif-count">{{ noLeidas.length }}</span>
            </div>
            <span class="notif-text" *ngIf="!collapsed">Notificaciones</span>
          </div>

          <!-- Dropdown Premium -->
          <div class="premium-dropdown" *ngIf="showNotifDropdown" (click)="$event.stopPropagation()">
            <div class="p-header">
              <div class="p-header-top">
                <span class="p-title">Avisos Recientes</span>
                <div class="p-header-actions">
                  <button class="p-icon-btn" title="Sincronizar" (click)="sincronizar($event)">🔄</button>
                </div>
              </div>
              <button *ngIf="noLeidas.length > 0" class="p-clear-btn" (click)="marcarTodasComoLeidas()">Marcar todo como leído</button>
            </div>
            
            <div class="p-list">
              <div *ngIf="noLeidas.length === 0" class="p-empty">
                <span class="p-empty-icon">📂</span>
                <p>Sin notificaciones pendientes</p>
              </div>

              <div *ngFor="let n of noLeidas" class="p-item" (click)="navegar(n)">
                <div class="p-item-content">
                  <p class="p-message">{{ n.mensaje }}</p>
                  <div class="p-meta">
                    <span class="p-date">{{ n.fechaCreacion | date:'dd MMM, HH:mm' }}</span>
                    <span class="p-new-badge" *ngIf="!n.leida">Nuevo</span>
                  </div>
                </div>
                <div class="p-arrow">→</div>
              </div>
            </div>
          </div>
        </div>

        <div class="user-display" *ngIf="username">
          <span class="footer-icon">👤</span>
          <span class="user-name">{{ username }}</span>
        </div>
        
        <button class="footer-item logout-btn" (click)="logout()">
          <span class="footer-icon">🚪</span>
          <span>Salir</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      width: 280px;
      height: 100vh;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease, transform 0.3s ease;
      z-index: 1000;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
    }

    .sidebar.collapsed {
      width: 80px;
    }

    .sidebar.collapsed .sidebar-main,
    .sidebar.collapsed .sidebar-footer .user-display,
    .sidebar.collapsed .sidebar-footer .logout-btn span:not(.footer-icon),
    .sidebar.collapsed .nav-brand-container {
      display: none !important;
    }

    .sidebar.collapsed .toggle-btn {
      right: auto;
      left: 50%;
      transform: translateX(-50%);
    }

    .sidebar-header {
      flex-shrink: 0;
      position: relative;
    }

    .toggle-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.2rem;
      transition: background 0.2s ease;
      z-index: 10;
    }

    .nav-brand-container {
      padding: 24px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      min-height: 110px;
    }

    .nav-brand {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px 10px;
      cursor: pointer;
      text-decoration: none;
      /* Fondo luminoso blanco restaurado */
      background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 65%);
      border-radius: 20px;
    }

    .brand-logo {
      position: relative;
      z-index: 1;
      display: block;
      max-width: 100%;
      height: auto;
      max-height: 55px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      transition: transform 0.3s ease;
    }

    .nav-brand:hover .brand-logo {
      transform: scale(1.05);
    }


    /* Notificaciones Premium en Footer */
    .notif-section {
      padding: 8px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
    }

    .notif-collapsed {
      display: flex;
      justify-content: center;
      padding: 12px 0;
    }

    .notif-bell-container {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 8px;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .notif-bell-container:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-1px);
    }

    .bell-circle {
      position: relative;
      width: 40px;
      height: 40px;
      background: rgba(59, 130, 246, 0.15);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .notif-bell-container:hover .bell-circle {
      background: rgba(59, 130, 246, 0.3);
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
    }

    .bell-emoji { font-size: 1.25rem; }

    .notif-count {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #ef4444;
      color: white;
      font-size: 11px;
      font-weight: 700;
      min-width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      border: 2px solid #0f172a;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .notif-text {
      font-size: 0.95rem;
      font-weight: 500;
      color: #cbd5e1;
    }

    /* Dropdown Premium Estilo Moderno */
    .premium-dropdown {
      position: absolute;
      bottom: 60px;
      left: 16px;
      width: 320px;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.05);
      z-index: 2000;
      overflow: hidden;
      animation: dropdown-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .notif-collapsed .premium-dropdown {
      left: 80px;
      bottom: 0px;
    }

    @keyframes dropdown-pop {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .p-header {
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .p-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .p-header-actions {
      display: flex;
      gap: 8px;
    }

    .p-icon-btn {
      background: #f1f5f9;
      border: none;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .p-icon-btn:hover {
      background: #e2e8f0;
      transform: scale(1.1);
    }

    .p-title { font-weight: 700; color: #1e293b; font-size: 0.95rem; letter-spacing: -0.2px; }
    .p-clear-btn { background: none; border: none; color: #3b82f6; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
    .p-clear-btn:hover { text-decoration: underline; }

    .p-list { max-height: 400px; overflow-y: auto; scrollbar-width: thin; }
    
    .p-empty { padding: 40px 20px; text-align: center; }
    .p-empty-icon { font-size: 2.5rem; display: block; margin-bottom: 12px; filter: grayscale(1); opacity: 0.5; }
    .p-empty p { color: #64748b; font-size: 0.9rem; margin: 0; }

    .p-item {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      border-bottom: 1px solid #f1f5f9;
    }

    .p-item:hover {
      background: #f1f5f9;
    }

    .p-item-content {
      flex: 1;
    }

    .p-message {
      margin: 0 0 6px 0;
      color: #334155;
      font-size: 0.88rem;
      line-height: 1.4;
      font-weight: 500;
    }

    .p-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .p-date {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .p-new-badge {
      background: #3b82f6;
      color: white;
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .p-arrow {
      color: #cbd5e1;
      font-size: 1.1rem;
      transition: transform 0.2s;
    }

    .p-item:hover .p-arrow {
      color: #3b82f6;
      transform: translateX(4px);
    }

    /* Main Navigation styles */
    .sidebar-main { flex: 1; overflow-y: auto; padding: 12px 0; }
    .category-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; transition: background 0.2s; }
    .category-header:hover { background: rgba(255, 255, 255, 0.08); }
    .category-label { flex: 1; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; color: #94a3b8; }
    .category-arrow { font-size: 0.7rem; transition: transform 0.3s; color: #64748b; }
    .category-arrow.expanded { transform: rotate(90deg); }
    .category-items { max-height: 0; overflow: hidden; transition: max-height 0.3s; }
    .category-items.expanded { max-height: 500px; }
    .side-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px 10px 52px; color: #cbd5e1; text-decoration: none; transition: all 0.2s; font-size: 0.95rem; border-left: 3px solid transparent; }
    .side-item:hover { background: rgba(255, 255, 255, 0.08); color: #fff; border-left-color: #3b82f6; }
    .side-item.active { background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-weight: 500; border-left-color: #3b82f6; }

    /* Footer styles */
    .sidebar-footer { flex-shrink: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 0; background: rgba(0, 0, 0, 0.2); }
    .user-display { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: #94a3b8; font-size: 0.9rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 8px; }
    .user-name { font-weight: 600; }
    .footer-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: #cbd5e1; cursor: pointer; width: 100%; border: none; background: transparent; text-align: left; }
    .footer-item:hover { background: rgba(255, 255, 255, 0.08); color: #fff; border-left: 3px solid #3b82f6; }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  collapsed = false;
  username: string | null = null;
  noLeidas: Notificacion[] = [];
  showNotifDropdown = false;
  private sub?: Subscription;

  @Output() collapsedChange = new EventEmitter<boolean>();

  categories: NavCategory[] = [
    {
      id: 'comercial',
      label: 'Comercial',
      icon: '📊',
      items: [
        { label: 'Clientes', route: '/clientes', icon: '👥' },
        { label: 'Locales', route: '/locales', icon: '🏢' },
        { label: 'Presupuestos', route: '/presupuestos', icon: '📑' },
        { label: 'Contratos', route: '/contratos', icon: '📃' }
      ]
    },
    {
      id: 'operaciones',
      label: 'Operaciones',
      icon: '⚙️',
      items: [
        { label: 'Intervenciones', route: '/intervenciones', icon: '🛠️' },
        { label: 'Seguimientos', route: '/seguimientos', icon: '📋' },
        { label: 'Ventas pendientes', route: '/ventas-pendientes', icon: '🧾' },
        { label: 'Contabilidad', route: '/operaciones/contabilidad', icon: '💹' },
        { label: 'Agendar citas', route: '/agendar-citas', icon: '📅' },
        { label: 'Almacen', route: '/productos', icon: '📦' },
        { label: 'Proveedores', route: '/proveedores', icon: '🤝' },
        { label: 'Análisis de Datos', route: '/operaciones/analisis-datos', icon: '📊' }
      ]
    },
    {
      id: 'rrhh',
      label: 'Recursos Humanos',
      icon: '👥',
      items: [
        { label: 'Gestión Empleados', route: '/rrhh/empleados', icon: '👤' },
        { label: 'Mi Portal (Ausencias)', route: '/rrhh/mi-portal', icon: '📅' }
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: '👥',
      items: [
        { label: 'Usuarios', route: '/usuarios', icon: '👤' },
        { label: 'Instaladores', route: '/tecnicos-instaladores', icon: '🛠️' },
        { label: 'Auditoría', route: '/auditoria', icon: '🔍' }
      ]
    },
    {
      id: 'comunicacion',
      label: 'Comunicación',
      icon: '💬',
      items: [
        { label: 'Chat', route: '/chat', icon: '💬' }
      ]
    }
  ];

  expandedCategories: { [key: string]: boolean } = {
    'comercial': true,
    'operaciones': false,
    'rrhh': false,
    'admin': false,
    'comunicacion': false
  };

  constructor(
    public auth: AuthService,
    private notifService: NotificacionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.username = this.auth.getUsername();
    if (this.auth.isLoggedIn()) {
      this.sub = interval(10000).pipe(
        startWith(0),
        switchMap(() => this.notifService.getNoLeidas()),
        catchError(err => {
          console.error('[Sidebar] Error polling notifications:', err);
          return of([]); // return empty observable on error instead of dying
        })
      ).subscribe(data => {
        this.noLeidas = data;
        if (data.length > 0) console.log('[Sidebar] Notifications loaded:', data.length);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.showNotifDropdown) {
      this.showNotifDropdown = false;
    }
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  toggleCategory(categoryId: string): void {
    this.expandedCategories[categoryId] = !this.expandedCategories[categoryId];
  }

  logout(): void {
    this.auth.logout();
  }

  canViewCategory(categoryId: string): boolean {
    if (categoryId === 'admin') {
      const role = this.auth.getRole();
      return role === 'ROLE_ADMIN';
    }
    return true;
  }

  toggleNotifDropdown(event: Event): void {
    event.stopPropagation();
    this.showNotifDropdown = !this.showNotifDropdown;
  }

  cerrarDropdown(): void {
    this.showNotifDropdown = false;
  }

  marcarComoLeida(n: Notificacion): void {
    this.notifService.marcarComoLeida(n.idNotificacion).subscribe(() => {
      this.noLeidas = this.noLeidas.filter(x => x.idNotificacion !== n.idNotificacion);
      if (this.noLeidas.length === 0) this.showNotifDropdown = false;
    });
  }

  navegar(n: Notificacion): void {
    if (n.link) {
      this.router.navigateByUrl(n.link);
      this.cerrarDropdown();
      if (!n.leida) {
        this.marcarComoLeida(n);
      }
    }
  }

  marcarTodasComoLeidas(): void {
    this.notifService.marcarTodasComoLeidas().subscribe(() => {
      this.noLeidas = [];
      this.showNotifDropdown = false;
    });
  }

  sincronizar(event: Event): void {
    event.stopPropagation();
    this.notifService.getNoLeidas().subscribe(data => {
      this.noLeidas = data;
      console.log('[Sidebar] Sincronización manual completada');
    });
  }
}
