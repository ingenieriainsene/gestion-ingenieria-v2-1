import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface NavItem {
  label: string;
  route: string;
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
          <a class="nav-brand" routerLink="/">Insene Solar</a>
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
                <span>{{ item.label }}</span>
              </a>
            </div>
          </div>
        </ng-container>
      </nav>

      <div class="sidebar-footer">
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
      width: 260px;
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
      width: 60px;
    }

    .sidebar.collapsed .sidebar-main,
    .sidebar.collapsed .sidebar-footer,
    .sidebar.collapsed .nav-brand-container {
      display: none !important;
    }

    .sidebar.collapsed .toggle-btn {
      right: auto;
      left: 50%;
      transform: translateX(-50%);
    }

    /* Header */
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

    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .nav-brand-container {
      padding: 20px 50px 20px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-brand {
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
      display: block;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Main Navigation */
    .sidebar-main {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 0;
    }

    .sidebar-main::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-main::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }

    .sidebar-main::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    .sidebar-main::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Category */
    .nav-category {
      margin-bottom: 4px;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.2s ease;
      user-select: none;
    }

    .category-header:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .category-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      width: 24px;
      text-align: center;
    }

    .category-label {
      flex: 1;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }

    .category-arrow {
      font-size: 0.7rem;
      transition: transform 0.3s ease;
      color: #64748b;
    }

    .category-arrow.expanded {
      transform: rotate(90deg);
    }

    /* Category Items */
    .category-items {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .category-items.expanded {
      max-height: 500px;
    }

    .side-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px 10px 52px;
      color: #cbd5e1;
      text-decoration: none;
      transition: all 0.2s ease;
      font-size: 0.95rem;
      border-left: 3px solid transparent;
    }

    .sidebar.collapsed .side-item {
      padding-left: 23px;
      justify-content: center;
    }

    .side-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border-left-color: #3b82f6;
    }

    .side-item.active {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      font-weight: 500;
      border-left-color: #3b82f6;
    }

    /* Footer */
    .sidebar-footer {
      flex-shrink: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 0;
      background: rgba(0, 0, 0, 0.2);
    }

    .user-display {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: #94a3b8;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 8px;
    }

    .user-name {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .footer-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: #cbd5e1;
      text-decoration: none;
      transition: all 0.2s ease;
      font-size: 0.95rem;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      cursor: pointer;
      border-left: 3px solid transparent;
    }

    .sidebar.collapsed .footer-item {
      justify-content: center;
    }

    .footer-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .footer-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border-left-color: #3b82f6;
    }

    .footer-item.active {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-left-color: #3b82f6;
    }

    .logout-btn {
      font-family: inherit;
    }

    .logout-btn:hover {
      border-left-color: #ef4444;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar:not(.collapsed) {
        transform: translateX(0);
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  collapsed = false;

  @Output() collapsedChange = new EventEmitter<boolean>();

  categories: NavCategory[] = [
    {
      id: 'comercial',
      label: 'Comercial',
      icon: '📊',
      items: [
        { label: 'Clientes', route: '/clientes' },
        { label: 'Presupuestos', route: '/presupuestos' },
        { label: 'Contratos', route: '/contratos' }
      ]
    },
    {
      id: 'operaciones',
      label: 'Operaciones',
      icon: '⚙️',
      items: [
        { label: 'Seguimientos', route: '/seguimientos' },
        { label: 'Agendar citas', route: '/agendar-citas' },
        { label: 'Almacen', route: '/productos' },
        { label: 'Proveedores', route: '/proveedores' },
        { label: 'Locales', route: '/locales' }
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: '👥',
      items: [
        { label: 'Usuarios', route: '/usuarios' },
        { label: 'Auditoría', route: '/auditoria' }
      ]
    },
    {
      id: 'comunicacion',
      label: 'Comunicación',
      icon: '💬',
      items: [
        { label: 'Chat', route: '/chat' }
      ]
    }
  ];

  expandedCategories: { [key: string]: boolean } = {
    'comercial': true,
    'operaciones': false,
    'admin': false,
    'comunicacion': false
  };

  username: string | null = null;

  constructor(public auth: AuthService) { }

  ngOnInit(): void {
    this.username = this.auth.getUsername();
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
}
