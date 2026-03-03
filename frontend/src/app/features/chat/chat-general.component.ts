import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ChatService } from '../../services/chat.service';
import { ChatMessage, ChatRoom, ChatUser, PrivateChatRequest } from '../../models/chat.model';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container"
         [ngClass]="{'mobile-view-list': isMobile && activeMobileView === 'list',
                     'mobile-view-chat': isMobile && activeMobileView === 'chat'}">
      <aside class="chat-sidebar" role="navigation" aria-label="Lista de chats">
        <div class="sidebar-header">
          <h3>Mensajería Interna</h3>
          <div class="sidebar-actions">
            <button class="btn-create" (click)="crearSala()" title="Crear canal">+ Canal</button>
            <button class="btn-create btn-private" (click)="solicitarChatPrivado()" title="Solicitar chat privado">+ Privado</button>
          </div>
        </div>
        
        <div class="sidebar-scroll">
          <div class="section-label">Recientes</div>
          <div *ngFor="let r of rooms" 
               class="room-item" 
               [class.active]="currentRoom?.id === r.id" 
               (click)="seleccionarSala(r)"
               tabindex="0"
               (keydown.enter)="seleccionarSala(r)">
            <div class="room-avatar">{{ (r.name || '?').charAt(0) }}</div>
            <div class="room-info">
              <div class="room-name">{{ r.name }}</div>
              <div class="room-status">{{ r.is_group ? 'Grupo' : 'Privado' }}</div>
            </div>
            <button
              *ngIf="puedeEliminarGrupo(r)"
              type="button"
              class="room-delete-btn"
              title="Eliminar grupo"
              (click)="eliminarGrupo(r, $event)">
              🗑️
            </button>
          </div>

          <div class="section-label" *ngIf="incomingRequests.length > 0">Solicitudes privadas</div>
          <div class="request-item" *ngFor="let req of incomingRequests">
            <div class="request-main">
              <div class="request-title">{{ req.from_user_name || 'Usuario' }}</div>
              <div class="request-subtitle">quiere abrir chat privado</div>
            </div>
            <div class="request-actions">
              <button class="btn-accept" (click)="aceptarSolicitud(req)">Aceptar</button>
              <button class="btn-reject" (click)="rechazarSolicitud(req)">Rechazar</button>
            </div>
          </div>
        </div>
      </aside>

      <main class="chat-content" role="log" aria-live="polite">
        <div class="content-header" *ngIf="currentRoom">
          <button *ngIf="isMobile" class="mobile-back-btn" (click)="volverAListado()">←</button>
          <div class="header-main">
            <span class="room-title">{{ currentRoom.name }}</span>
            <small class="room-subtitle">Chat del equipo</small>
          </div>
        </div>

        <div class="content-body" *ngIf="currentRoom; else selectRoom">
          <div class="messages-viewport" #scrollBox>
            <div *ngFor="let m of mensajes" class="message-row" [class.me]="esMio(m)">
              <div class="message-bubble">
                <div class="message-meta" *ngIf="!esMio(m)">
                  {{ nombreRemitente(m) }}
                </div>
                <div class="message-text">{{ m.content }}</div>
                <div class="message-time">{{ m.created_at | date:'HH:mm' }}</div>
              </div>
            </div>
          </div>

          <div class="input-container">
            <div class="input-wrapper">
              <input type="text" 
                     [(ngModel)]="texto" 
                     (keydown.enter)="enviar()" 
                     placeholder="Escribe un mensaje aquí..." 
                     [attr.aria-label]="currentRoom ? 'Mensaje para ' + currentRoom.name : 'Escribe un mensaje'" />
            </div>
            <button class="btn-send" (click)="enviar()" [disabled]="!texto.trim()">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
              </svg>
            </button>
          </div>
        </div>

        <ng-template #selectRoom>
          <div class="no-selection-state">
            <div class="illustration">📱</div>
            <h3>Chat de la empresa</h3>
            <p>Selecciona un canal para empezar a conversar con tu equipo.</p>
          </div>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    :host { --chat-bg: #f8fafc; --chat-header: #ffffff; --chat-bubble-me: #dbeafe; --chat-bubble-other: #ffffff; --chat-text: #0f172a; --chat-primary: #2563eb; }
    
    .chat-container { display: flex; height: 700px; max-height: calc(100vh - 150px); background: var(--chat-bg); border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06); }
    
    .chat-sidebar { width: 340px; background: #fff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
    .sidebar-header { padding: 12px 16px; background: var(--chat-header); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; min-height: 60px; }
    .sidebar-header h3 { font-size: 1rem; color: var(--chat-text); margin: 0; }
    .sidebar-actions { display: flex; gap: 6px; }
    .btn-create { border: 1px solid #dbeafe; border-radius: 8px; background: #eff6ff; color: #1d4ed8; cursor: pointer; font-size: 0.85rem; font-weight: 700; padding: 6px 10px; transition: 0.2s; }
    .btn-create:hover { background: #dbeafe; }
    .btn-create.btn-private { border-color: #ddd6fe; background: #f5f3ff; color: #6d28d9; }
    .btn-create.btn-private:hover { background: #ede9fe; }
    
    .sidebar-scroll { flex: 1; overflow-y: auto; background: white; }
    .section-label { padding: 15px 16px 8px; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    
    .room-item { display: flex; align-items: center; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f8fafc; transition: 0.1s; }
    .room-item:hover { background: #f8fafc; }
    .room-item.active { background: #eff6ff; }
    .room-avatar { width: 40px; height: 40px; border-radius: 50%; background: #dbeafe; color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-right: 12px; flex-shrink: 0; font-weight: 700; }
    .room-info { flex: 1; overflow: hidden; }
    .room-name { font-size: 0.95rem; color: var(--chat-text); font-weight: 600; }
    .room-status { font-size: 0.8rem; color: #64748b; }
    .room-delete-btn { background: transparent; border: none; color: #ef4444; cursor: pointer; opacity: 0.75; font-size: 1rem; }
    .room-delete-btn:hover { opacity: 1; }
    .request-item { margin: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #f8fafc; }
    .request-main { margin-bottom: 8px; }
    .request-title { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .request-subtitle { font-size: 0.78rem; color: #64748b; }
    .request-actions { display: flex; gap: 8px; }
    .btn-accept, .btn-reject { flex: 1; border: none; border-radius: 8px; padding: 6px 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
    .btn-accept { background: #dcfce7; color: #15803d; }
    .btn-accept:hover { background: #bbf7d0; }
    .btn-reject { background: #fee2e2; color: #b91c1c; }
    .btn-reject:hover { background: #fecaca; }

    .chat-content { flex: 1; display: flex; flex-direction: column; background: #f8fafc; }
    .content-header { padding: 10px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; min-height: 60px; }
    .header-main { display: flex; flex-direction: column; gap: 2px; }
    .room-title { font-weight: 700; font-size: 0.98rem; color: var(--chat-text); }
    .room-subtitle { color: #64748b; font-size: 0.75rem; }
    .mobile-back-btn {
      margin-right: 10px;
      border: none;
      background: transparent;
      font-size: 1.3rem;
      cursor: pointer;
      color: #64748b;
    }
    .mobile-back-btn:hover {
      color: #1e293b;
    }
    
    .content-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .messages-viewport { flex: 1; padding: 16px 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
    
    .message-row { display: flex; width: 100%; margin-bottom: 2px; }
    .message-row.me { justify-content: flex-end; }
    
    .message-bubble { max-width: 72%; padding: 8px 11px; border-radius: 10px; position: relative; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05); font-size: 0.9rem; border: 1px solid #e2e8f0; }
    .message-row:not(.me) .message-bubble { background: var(--chat-bubble-other); border-top-left-radius: 3px; }
    .me .message-bubble { background: var(--chat-bubble-me); border-top-right-radius: 3px; border-color: #bfdbfe; }
    
    .message-meta { font-size: 0.7rem; color: #7c3aed; font-weight: 700; margin-bottom: 2px; }
    .message-text { color: var(--chat-text); line-height: 1.45; word-wrap: break-word; }
    .message-time { font-size: 0.65rem; color: #64748b; text-align: right; margin-top: 3px; }

    .input-container { padding: 10px 14px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; }
    .input-wrapper { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 12px; display: flex; align-items: center; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 0.92rem; background: transparent; color: #0f172a; }
    .btn-send { border: none; background: #1d4ed8; color: white; cursor: pointer; border-radius: 10px; padding: 7px 10px; display: flex; align-items: center; justify-content: center; }
    .btn-send:hover:not(:disabled) { background: #1e40af; }
    .btn-send:disabled { opacity: 0.55; cursor: not-allowed; }
    
    .no-selection-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; text-align: center; padding: 40px; }
    .illustration { font-size: 4rem; margin-bottom: 14px; }

    @media (max-width: 768px) {
      .chat-container {
        height: calc(100vh - 120px);
        border-radius: 10px;
        flex-direction: column;
      }

      .chat-sidebar {
        width: 100%;
        min-width: 100%;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
      }

      .chat-content {
        width: 100%;
        min-width: 100%;
      }

      .sidebar-header {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
      }

      .messages-viewport {
        padding: 12px;
      }

      .message-bubble {
        max-width: 95%;
      }

      .chat-container.mobile-view-list .chat-sidebar {
        display: flex;
      }

      .chat-container.mobile-view-list .chat-content {
        display: none;
      }

      .chat-container.mobile-view-chat .chat-sidebar {
        display: none;
      }

      .chat-container.mobile-view-chat .chat-content {
        display: flex;
      }
    }
  `]
})
export class ChatGeneralComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollBox') private scrollContainer!: ElementRef;

  currentRoom: ChatRoom | null = null;
  mensajes: ChatMessage[] = [];
  texto = '';
  currentUsername = '';
  userChatId = '';
  isAdmin = false;
   // Estado responsive
  isMobile = false;
  activeMobileView: 'list' | 'chat' = 'chat';
  rooms: ChatRoom[] = [];
  users: ChatUser[] = [];
  incomingRequests: PrivateChatRequest[] = [];

  private shouldScroll = false;
  private chatPollingSubscription: Subscription | null = null;
  private identitySubscription: Subscription | null = null;
  private roomsSubscription: Subscription | null = null;
  private incomingRequestSubscription: Subscription | null = null;

  constructor(private chat: ChatService, private auth: AuthService) { }

  ngOnInit(): void {
    this.isAdmin = this.auth.getRole() === 'ROLE_ADMIN';
    this.checkMobileLayout();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize);
    }
    this.identitySubscription = this.chat.getMyIdentity().subscribe({
      next: (id) => {
        this.userChatId = id.chatId;
        this.currentUsername = id.username || '';
        this.cargarSolicitudesEntrantes();
      },
      error: () => {
        this.userChatId = '';
        this.currentUsername = '';
      }
    });

    this.refrescarSalas();
    this.chat.getUsers().subscribe({
      next: (users) => {
        this.users = users || [];
      },
      error: () => {
        this.users = [];
      }
    });

    this.incomingRequestSubscription = interval(5000)
      .pipe(switchMap(() => this.chat.getIncomingPrivateRequests()))
      .subscribe({
        next: (requests) => {
          this.incomingRequests = requests || [];
        },
        error: () => { }
      });
  }

  ngOnDestroy(): void {
    if (this.chatPollingSubscription) this.chatPollingSubscription.unsubscribe();
    if (this.identitySubscription) this.identitySubscription.unsubscribe();
    if (this.roomsSubscription) this.roomsSubscription.unsubscribe();
    if (this.incomingRequestSubscription) this.incomingRequestSubscription.unsubscribe();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }

  seleccionarSala(room: ChatRoom) {
    if (this.currentRoom?.id === room.id) return;

    this.currentRoom = room;
    if (this.isMobile) {
      this.activeMobileView = 'chat';
    }
    if (this.chatPollingSubscription) this.chatPollingSubscription.unsubscribe();
    this.mensajes = [];

    this.chatPollingSubscription = interval(2000)
      .pipe(switchMap(() => this.chat.getMessagesByRoom(room.id)))
      .subscribe({
        next: (msgs) => {
          const ordered = [...(msgs || [])].sort((a, b) =>
            new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
          );
          const lastOld = this.mensajes.length ? this.mensajes[this.mensajes.length - 1].id : null;
          const lastNew = ordered.length ? ordered[ordered.length - 1].id : null;
          this.mensajes = ordered;
          if (lastOld !== lastNew) {
            this.shouldScroll = true;
          }
        },
        error: () => { }
      });

    this.chat.getMessagesByRoom(room.id).subscribe({
      next: (msgs) => {
        this.mensajes = [...(msgs || [])].sort((a, b) =>
          new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        );
        this.shouldScroll = true;
      },
      error: () => {
        this.mensajes = [];
      }
    });
  }

  enviar() {
    if (!this.texto.trim() || !this.currentRoom) return;

    const textoAEnviar = this.texto.trim();
    this.texto = '';
    this.chat.sendMessage(this.currentRoom.id, textoAEnviar, this.userChatId).subscribe({
      next: (saved) => {
        this.mensajes = [...this.mensajes, saved];
        this.shouldScroll = true;
      },
      error: (error) => {
        console.error('Error al enviar mensaje:', error);
        Swal.fire('Error', `No se pudo enviar el mensaje: ${error?.error || error?.message || 'Error servidor'}`, 'error');
      }
    });
  }

  esMio(m: ChatMessage): boolean {
    if (!m?.sender_id || !this.userChatId) return false;
    return m.sender_id === this.userChatId;
  }

  nombreRemitente(m: ChatMessage): string {
    const nombre = (m?.sender_name || '').trim();
    if (nombre) return nombre;
    const id = m?.sender_id || '';
    return id ? id.substring(0, 8) : 'Sistema';
  }

  crearSala() {
    Swal.fire({
      title: 'Nuevo Canal',
      input: 'text',
      inputLabel: 'Nombre del canal',
      inputPlaceholder: 'Ej: General, Soporte...',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return '¡Necesitas un nombre!';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.chat.createRoom(result.value, true).subscribe({
          next: (newRoom) => {
            this.refrescarSalas();
            this.seleccionarSala(newRoom);
            Swal.fire('¡Creado!', `El canal "${result.value}" ha sido creado.`, 'success');
          },
          error: (err) => {
            console.error('Error al crear canal:', err);
            const msg = err.error?.message || err.error || 'Error desconocido';
            Swal.fire('Error', `No se pudo crear el canal: ${msg}`, 'error');
          }
        });
      }
    });
  }

  private checkMobileLayout() {
    if (typeof window === 'undefined') {
      this.isMobile = false;
      this.activeMobileView = 'chat';
      return;
    }
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.activeMobileView = 'chat';
    } else if (!this.currentRoom) {
      this.activeMobileView = 'list';
    }
  }

  private onResize = () => {
    this.checkMobileLayout();
  };

  volverAListado() {
    if (this.isMobile) {
      this.activeMobileView = 'list';
    }
  }

  private refrescarSalas() {
    if (this.roomsSubscription) this.roomsSubscription.unsubscribe();
    this.roomsSubscription = this.chat.getRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms || [];
        if (!this.currentRoom && this.rooms.length > 0) {
          this.seleccionarSala(this.rooms[0]);
          return;
        }
        if (this.currentRoom) {
          const found = this.rooms.find(r => r.id === this.currentRoom?.id);
          if (!found) {
            this.currentRoom = null;
            this.mensajes = [];
          }
        }
      },
      error: () => {
        this.rooms = [];
      }
    });
  }

  private cargarSolicitudesEntrantes() {
    this.chat.getIncomingPrivateRequests().subscribe({
      next: (requests) => {
        this.incomingRequests = requests || [];
      },
      error: () => {
        this.incomingRequests = [];
      }
    });
  }

  solicitarChatPrivado() {
    if (!this.users.length) {
      Swal.fire('Aviso', 'No hay usuarios disponibles para chat privado.', 'info');
      return;
    }

    Swal.fire({
      title: 'Solicitar chat privado',
      input: 'select',
      inputOptions: this.users.reduce((acc: Record<string, string>, u) => {
        acc[String(u.id_usuario)] = u.nombre_usuario;
        return acc;
      }, {}),
      inputPlaceholder: 'Selecciona usuario',
      showCancelButton: true,
      confirmButtonText: 'Enviar solicitud',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Selecciona un usuario.';
        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed) return;
      const toUserId = Number(result.value);
      if (!toUserId) return;
      this.chat.createPrivateRequest(toUserId).subscribe({
        next: () => {
          Swal.fire('Enviada', 'Solicitud de chat privado enviada.', 'success');
        },
        error: (err) => {
          const msg = err?.error || err?.error?.message || 'No se pudo enviar la solicitud.';
          Swal.fire('Error', msg, 'error');
        }
      });
    });
  }

  aceptarSolicitud(req: PrivateChatRequest) {
    this.chat.acceptPrivateRequest(req.id).subscribe({
      next: (room) => {
        this.incomingRequests = this.incomingRequests.filter(r => r.id !== req.id);
        this.refrescarSalas();
        this.seleccionarSala(room);
        Swal.fire('Aceptado', 'Chat privado creado correctamente.', 'success');
      },
      error: (err) => {
        const msg = err?.error || err?.error?.message || 'No se pudo aceptar la solicitud.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  rechazarSolicitud(req: PrivateChatRequest) {
    this.chat.rejectPrivateRequest(req.id).subscribe({
      next: () => {
        this.incomingRequests = this.incomingRequests.filter(r => r.id !== req.id);
      },
      error: (err) => {
        const msg = err?.error || err?.error?.message || 'No se pudo rechazar la solicitud.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  puedeEliminarGrupo(room: ChatRoom): boolean {
    return this.isAdmin && !!room?.is_group;
  }

  eliminarGrupo(room: ChatRoom, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.puedeEliminarGrupo(room) || !room?.id) return;
    Swal.fire({
      title: '¿Eliminar grupo?',
      text: `Se eliminará "${room.name}" y todos sus mensajes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91c1c',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.chat.deleteRoom(room.id).subscribe({
        next: () => {
          if (this.currentRoom?.id === room.id) {
            this.currentRoom = null;
            this.mensajes = [];
          }
          this.refrescarSalas();
          Swal.fire('Eliminado', 'Grupo eliminado correctamente.', 'success');
        },
        error: (err) => {
          const msg = err?.error || err?.error?.message || 'No se pudo eliminar el grupo.';
          Swal.fire('Error', msg, 'error');
        }
      });
    });
  }
}
