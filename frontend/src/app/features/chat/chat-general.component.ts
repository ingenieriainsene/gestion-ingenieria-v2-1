import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import Swal from 'sweetalert2';
import { ChatService, ChatMessage, ChatSala } from '../../services/chat.service';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { environment } from '../../../environments/environments';

@Component({
  selector: 'app-chat-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-layout">
      <!-- SIDEBAR -->
      <aside class="chat-sidebar">
        <div class="sidebar-header">
          <h2>Chats</h2>
          <div class="user-status" *ngIf="usuarioActual">
            <span class="dot online"></span> {{ usuarioActual.nombreUsuario }}
          </div>
        </div>
        
        <div class="sidebar-list">
          <div class="list-title">Sala Global</div>
          <div class="chat-item" [class.active]="sala?.esGlobal" (click)="abrirGlobal()">
            <div class="avatar global">#</div>
            <div class="info">
              <span class="name">Chat General</span>
              <span class="last-msg">Sala pública</span>
            </div>
          </div>

          <div class="list-title">Usuarios</div>
          <div *ngFor="let u of usuariosList" class="chat-item" 
               [class.active]="sala?.nombre === u.nombreUsuario" 
               (click)="abrirPrivado(u)">
            <div class="avatar">{{ u.nombreUsuario.charAt(0).toUpperCase() }}</div>
            <div class="info">
              <span class="name">{{ u.nombreUsuario }}</span>
              <span class="last-msg">{{ u.rol }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- MAIN AREA -->
      <main class="chat-main">
        <div class="chat-header" *ngIf="sala; else noChat">
          <div class="header-info">
            <h3>{{ sala.nombre }}</h3>
            <span class="status" *ngIf="!errorConexion && stompClient?.connected">Conectado</span>
            <span class="status error" *ngIf="errorConexion">Sin conexión</span>
          </div>
        </div>

        <ng-template #noChat>
          <div class="no-chat-selected">
            <p>Selecciona un usuario o sala para comenzar</p>
          </div>
        </ng-template>

        <div class="chat-body" *ngIf="sala">
          <div class="messages-area" #scrollBox>
             <div *ngIf="mensajes.length === 0" class="empty-state">
              No hay mensajes aquí. ¡Di hola!
            </div>
            <div *ngFor="let m of mensajes" class="msg" [class.me]="m.usuarioId === usuarioActualId">
              <div class="msg-bubble">
                <div class="msg-author" *ngIf="m.usuarioId !== usuarioActualId">{{ m.usuarioNombre }}</div>
                <div class="msg-text">{{ m.contenido }}</div>
                <div class="msg-attachments" *ngIf="m.adjuntos?.length">
                   <a *ngFor="let a of m.adjuntos" [href]="a.url" target="_blank">📎 {{ a.nombre }}</a>
                </div>
                <div class="msg-time">{{ m.fechaEnvio | date:'HH:mm' }}</div>
              </div>
            </div>
          </div>

          <div class="chat-input-area">
             <div class="attachment-preview" *ngIf="adjuntoPendiente">
               <span>📎 {{ adjuntoPendiente.nombre }}</span>
               <button (click)="adjuntoPendiente = null">x</button>
             </div>
             <div class="input-row">
               <label class="btn-attach">
                 + <input type="file" (change)="onFile($event)" hidden />
               </label>
               <input type="text" [(ngModel)]="texto" (keydown.enter)="enviar()" placeholder="Escribe un mensaje..." />
               <button class="btn-send" (click)="enviar()">➤</button>
             </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .chat-layout { display: flex; height: calc(100vh - 64px); background: #f0f2f5; font-family: 'Segoe UI', sans-serif; }
    
    /* SIDEBAR */
    .chat-sidebar { width: 300px; background: white; border-right: 1px solid #ddd; display: flex; flex-direction: column; }
    .sidebar-header { padding: 16px; background: #f0f2f5; border-bottom: 1px solid #ddd; display:flex; justify-content:space-between; align-items:center; }
    .sidebar-header h2 { margin: 0; font-size: 1.2rem; }
    .user-status { font-size: 0.85rem; color: #666; display:flex; align-items:center; gap:5px; }
    .dot { width:8px; height:8px; border-radius:50%; background:#ccc; }
    .dot.online { background:#25D366; }

    .sidebar-list { overflow-y: auto; flex: 1; }
    .list-title { padding: 10px 16px; font-size: 0.75rem; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .chat-item { display: flex; align-items: center; padding: 10px 16px; cursor: pointer; transition: 0.2s; border-bottom: 1px solid #f0f0f0; }
    .chat-item:hover { background: #f5f5f5; }
    .chat-item.active { background: #e6f2ff; border-left: 4px solid #007bff; }
    
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #555; margin-right: 12px; flex-shrink: 0; }
    .avatar.global { background: #007bff; color: white; }
    
    .info { display: flex; flex-direction: column; overflow: hidden; }
    .name { font-weight: 600; font-size: 0.95rem; color: #333; }
    .last-msg { font-size: 0.8rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* MAIN */
    .chat-main { flex: 1; display: flex; flex-direction: column; background: #efeae2; position: relative; }
    
    .chat-header { padding: 10px 16px; background: #f0f2f5; border-bottom: 1px solid #ddd; display: flex; align-items: center; justify-content: space-between; height: 60px; }
    .chat-header h3 { margin: 0; font-size: 1rem; }
    .status { font-size: 0.75rem; color: #25D366; }
    .status.error { color: red; }

    .no-chat-selected { display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 1.2rem; }

    .chat-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .messages-area { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    
    .empty-state { text-align: center; color: #888; margin-top: 50px; background: rgba(255,255,255,0.6); padding: 10px; border-radius: 10px; width: fit-content; align-self: center; }

    .msg { display: flex; flex-direction: column; max-width: 60%; }
    .msg.me { align-self: flex-end; align-items: flex-end; }
    
    .msg-bubble { padding: 8px 12px; border-radius: 8px; background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.1); position: relative; min-width: 100px; }
    .msg.me .msg-bubble { background: #d9fdd3; }
    
    .msg-author { font-size: 0.75rem; color: #e542a3; font-weight: bold; margin-bottom: 4px; }
    .msg-text { font-size: 0.95rem; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word; }
    .msg-time { font-size: 0.65rem; color: #999; text-align: right; margin-top: 4px; }
    .msg-attachments a { display: block; background: #f0f0f0; padding: 5px; margin-top: 5px; border-radius: 4px; text-decoration: none; color: #333; font-size: 0.85rem; }

    .chat-input-area { background: #f0f2f5; padding: 10px; border-top: 1px solid #ddd; }
    .attachment-preview { background: #e6f7ff; padding: 5px 10px; border-radius: 4px; display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.85rem; }
    .input-row { display: flex; gap: 10px; align-items: center; }
    
    .btn-attach { padding: 8px 14px; background: #e4e6eb; border-radius: 50%; cursor: pointer; font-size: 1.2rem; color: #666; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; transition:0.2s; }
    .btn-attach:hover { background: #d8dadf; }
    
    input[type="text"] { flex: 1; padding: 12px; border: none; border-radius: 20px; outline: none; font-size: 0.95rem; }
    
    .btn-send { width: 40px; height: 40px; border: none; background: #007bff; color: white; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition:0.2s; }
    .btn-send:hover { background: #0056b3; }
  `]
})
export class ChatGeneralComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollBox') private scrollContainer!: ElementRef;

  sala: ChatSala | null = null;
  mensajes: ChatMessage[] = [];
  texto = '';

  usuarioActual: Usuario | null = null;
  usuarioActualId: number | null = null;

  usuariosList: Usuario[] = [];

  errorConexion: string | null = null;
  stompClient: Client | null = null;
  adjuntoPendiente: { url: string; tipo?: string; nombre?: string } | null = null;
  private shouldScroll = false;
  private topicSubscription: any;

  constructor(private chat: ChatService, private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    // 1. Obtener usuario actual (simulado o del servicio)
    this.usuarioService.getAll().subscribe(users => {
      // FILTRAR: No mostrarme a mí mismo en la lista
      // Por ahora simulamos que soy el primero de la lista o el que tenga token (admin)
      const admin = users.find(u => u.nombreUsuario === 'jefe_admin') || users[0];
      this.usuarioActual = admin;
      this.usuarioActualId = admin.idUsuario ?? null;

      this.usuariosList = users.filter(u => u.idUsuario !== this.usuarioActualId);

      // Conectar WS general al inicio
      this.connectWs();
    });
  }

  ngOnDestroy(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToTop();
      this.shouldScroll = false;
    }
  }

  scrollToTop(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }

  abrirGlobal() {
    this.chat.getSalaGeneral().subscribe(s => {
      this.seleccionarSala(s);
    });
  }

  abrirPrivado(otroUsuario: Usuario) {
    if (!this.usuarioActualId || !otroUsuario.idUsuario) return;
    this.chat.iniciarPrivado(this.usuarioActualId, otroUsuario.idUsuario).subscribe(s => {
      this.seleccionarSala(s);
    });
  }

  seleccionarSala(s: ChatSala) {
    if (this.sala?.idSala === s.idSala) return;

    this.sala = s;
    this.mensajes = [];
    this.chat.getMensajes(s.idSala).subscribe(msgs => {
      this.mensajes = (msgs || []).reverse();
      this.shouldScroll = true;
    });

    // Suscribirse al topic de esta sala
    this.subscribeToRoom(s.idSala);
  }

  connectWs() {
    try {
      const SockJSClient: any = (SockJS as any).default || (SockJS as any);
      const wsUrl = environment.apiUrl.replace('/api', '/ws');

      const client = new Client({
        webSocketFactory: () => new SockJSClient(wsUrl),
        reconnectDelay: 5000,
        debug: (str) => console.log(str)
      });

      client.onConnect = () => {
        this.errorConexion = null;
        console.log('WS Connected');
        // Si ya hay sala seleccionada, resuscribirse
        if (this.sala) {
          this.subscribeToRoom(this.sala.idSala);
        }
      };

      client.onStompError = (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        this.errorConexion = 'Error de conexión';
      };

      client.onWebSocketError = (ev) => {
        console.error('Error WS connection', ev);
        this.errorConexion = 'No se puede conectar';
      };

      client.activate();
      this.stompClient = client;
    } catch (e) {
      console.error(e);
      this.errorConexion = 'Error inciando WS';
    }
  }

  subscribeToRoom(salaId: number) {
    if (!this.stompClient || !this.stompClient.connected) return;

    // Unsubscribe previous
    if (this.topicSubscription) {
      this.topicSubscription.unsubscribe();
    }

    // NOTA: El backend sigue difundiendo a /topic/chat.general. 
    // Idealmente el backend debería enviar a /topic/sala/{id}.
    // Por compatibilidad inmediata, filtraré en el cliente.

    this.topicSubscription = this.stompClient.subscribe('/topic/chat.general', (msg: IMessage) => {
      const body = JSON.parse(msg.body);
      // Solo agregar si pertenece a la sala actual
      if (body.salaId === this.sala?.idSala) {
        this.mensajes.push(body);
        this.shouldScroll = true;
      }
    });
  }

  enviar() {
    if (!this.texto.trim() && !this.adjuntoPendiente) return;
    if (!this.sala || !this.usuarioActualId) return;

    const payload = {
      salaId: this.sala.idSala,
      usuarioId: this.usuarioActualId,
      contenido: this.texto.trim() || (this.adjuntoPendiente ? 'Archivo adjunto' : '.'),
      adjuntos: this.adjuntoPendiente ? [this.adjuntoPendiente] : []
    };

    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
      this.texto = '';
      this.adjuntoPendiente = null;
    } else {
      Swal.fire('Error', 'No hay conexión', 'error');
    }
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.chat.upload(file).subscribe({
      next: (res) => this.adjuntoPendiente = res,
      error: () => Swal.fire('Error', 'Fallo subida', 'error')
    });
  }
}
