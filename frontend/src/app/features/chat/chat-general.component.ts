import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ChatService } from '../../services/chat.service';
import { ChatMessage, ChatRoom } from '../../models/chat.model';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-chat-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <!-- SIDEBAR WHATSAPP -->
      <aside class="chat-sidebar" role="navigation" aria-label="Lista de chats">
        <div class="sidebar-header">
          <h3>Chats</h3>
          <button class="btn-create" (click)="crearSala()" title="Nuevo Chat">+</button>
        </div>
        
        <div class="sidebar-scroll">
          <div class="section-label">Recientes</div>
          <div *ngFor="let r of rooms" 
               class="room-item" 
               [class.active]="currentRoom?.id === r.id" 
               (click)="seleccionarSala(r)"
               tabindex="0"
               (keydown.enter)="seleccionarSala(r)">
            <div class="room-avatar">{{ r.name.charAt(0) }}</div>
            <div class="room-info">
              <div class="room-name">{{ r.name }}</div>
              <div class="room-status">en línea</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- VENTANA DE CHAT -->
      <main class="chat-content" role="log" aria-live="polite">
        <div class="content-header" *ngIf="currentRoom">
          <div class="header-main">
            <span class="room-title">{{ currentRoom.name }}</span>
          </div>
        </div>

        <div class="content-body" *ngIf="currentRoom; else selectRoom">
          <div class="messages-viewport" #scrollBox>
            <div *ngFor="let m of mensajes" class="message-row" [class.me]="m.sender_id === supabaseUserId">
              <div class="message-bubble">
                <div class="message-meta" *ngIf="m.sender_id !== supabaseUserId">
                  {{ m.sender_id.substring(0, 8) }}
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
            <h3>WhatsApp para Gestión</h3>
            <p>Selecciona un chat para ver los mensajes y coordinar con el equipo.</p>
          </div>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    :host { --wa-bg: #efeae2; --wa-header: #f0f2f5; --wa-chat-bg: #ffffff; --wa-bubble-me: #d9fdd3; --wa-bubble-other: #ffffff; --wa-text: #111b21; --wa-primary: #00a884; }
    
    .chat-container { display: flex; height: 700px; max-height: calc(100vh - 150px); background: var(--wa-bg); border-radius: 0; border: 1px solid #d1d7db; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.05); }
    
    /* Sidebar WhatsApp */
    .chat-sidebar { width: 350px; background: white; border-right: 1px solid #d1d7db; display: flex; flex-direction: column; }
    .sidebar-header { padding: 12px 16px; background: var(--wa-header); display: flex; justify-content: space-between; align-items: center; height: 60px; }
    .sidebar-header h3 { font-size: 1.1rem; color: var(--wa-text); }
    .btn-create { width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent; color: #54656f; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-create:hover { background: rgba(0,0,0,0.05); }
    
    .sidebar-scroll { flex: 1; overflow-y: auto; background: white; }
    .section-label { padding: 15px 16px 8px; font-size: 0.8rem; color: var(--wa-primary); font-weight: 600; text-transform: uppercase; }
    
    .room-item { display: flex; align-items: center; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f0f2f5; transition: 0.1s; }
    .room-item:hover { background: #f5f6f6; }
    .room-item.active { background: #ebebeb; }
    .room-avatar { width: 48px; height: 48px; border-radius: 50%; background: #dfe5e7; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin-right: 15px; flex-shrink: 0; }
    .room-info { flex: 1; overflow: hidden; }
    .room-name { font-size: 1rem; color: var(--wa-text); font-weight: 500; }
    .room-status { font-size: 0.85rem; color: #667781; }

    /* Ventana de Chat al estilo WhatsApp */
    .chat-content { flex: 1; display: flex; flex-direction: column; background: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-color: #efeae2; }
    .content-header { padding: 10px 16px; background: var(--wa-header); border-bottom: 1px solid #d1d7db; display: flex; align-items: center; height: 60px; }
    .room-title { font-weight: 500; font-size: 1rem; color: var(--wa-text); }
    
    .content-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .messages-viewport { flex: 1; padding: 20px 7%; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    
    .message-row { display: flex; width: 100%; margin-bottom: 2px; }
    .message-row.me { justify-content: flex-end; }
    
    .message-bubble { max-width: 65%; padding: 6px 10px 8px; border-radius: 8px; position: relative; box-shadow: 0 1px 0.5px rgba(0,0,0,0.13); font-size: 0.9rem; }
    .message-row:not(.me) .message-bubble { background: var(--wa-bubble-other); border-top-left-radius: 0; }
    .me .message-bubble { background: var(--wa-bubble-me); border-top-right-radius: 0; }
    
    .message-meta { font-size: 0.75rem; color: #e542a3; font-weight: 600; margin-bottom: 2px; }
    .message-text { color: var(--wa-text); line-height: 1.4; word-wrap: break-word; }
    .message-time { font-size: 0.65rem; color: #667781; text-align: right; margin-top: 2px; }

    /* Barra de entrada mejorada */
    .input-container { padding: 10px 16px; background: var(--wa-header); display: flex; align-items: center; gap: 10px; }
    .input-wrapper { flex: 1; background: white; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 0.95rem; background: transparent; }
    .btn-send { background: none; border: none; color: #54656f; cursor: pointer; padding: 5px; display: flex; align-items: center; justify-content: center; }
    .btn-send:hover:not(:disabled) { color: var(--wa-primary); }
    
    .no-selection-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; text-align: center; padding: 40px; }
    .illustration { font-size: 5rem; margin-bottom: 20px; }
  `]
})
export class ChatGeneralComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollBox') private scrollContainer!: ElementRef;

  currentRoom: ChatRoom | null = null;
  mensajes: ChatMessage[] = [];
  texto = '';
  usuarioActual: Usuario | null = null;
  supabaseUserId: string = '';
  rooms: ChatRoom[] = [];

  private shouldScroll = false;
  private chatSubscription: Subscription | null = null;

  constructor(private chat: ChatService, private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    this.usuarioService.getAll().pipe(
      map(users => users.find(u => u.nombreUsuario === 'jefe_admin') || users[0])
    ).subscribe(user => {
      this.usuarioActual = user;
      this.chat.getMyIdentity().subscribe(id => {
        this.supabaseUserId = id.chatId;
      });
    });

    this.chat.getRooms().subscribe(rooms => {
      this.rooms = rooms;
    });
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) this.chatSubscription.unsubscribe();
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
    if (this.chatSubscription) this.chatSubscription.unsubscribe();

    this.chatSubscription = this.chat.subscribeToRoom(room.id).subscribe(msgs => {
      this.mensajes = msgs;
      this.shouldScroll = true;
    });
  }

  async enviar() {
    if (!this.texto.trim() || !this.currentRoom) return;

    const textoAEnviar = this.texto.trim();
    this.texto = ''; // Limpiamos rápido para sensación de rapidez

    try {
      await this.chat.sendMessage(this.currentRoom.id, textoAEnviar, this.supabaseUserId);
      // No necesitamos añadirlo manualmente si Realtime funciona bien, 
      // pero si queremos "WhatsApp speed", podríamos hacer un push optimista aquí.
      // Pero primero asegurémonos que Realtime detecte el cambio del backend.
      this.shouldScroll = true;
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      Swal.fire('Error', `No se pudo enviar el mensaje: ${error.message || 'Error servidor'}`, 'error');
    }
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
            this.rooms.push(newRoom);
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
}
