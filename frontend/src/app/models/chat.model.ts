// Modelos para el sistema de chat interno (API Spring Boot)

export interface ChatMessage {
    id: string; // UUID
    room_id: string; // UUID
    sender_id?: string | null; // UUID del usuario emisor
    sender_name?: string | null; // Nombre de usuario legible
    content: string;
    created_at?: string;
}

export interface ChatRoom {
    id: string; // UUID
    name: string;
    is_group: boolean;
    created_at?: string;
    created_by?: string;
}

export interface ChatUserRoom {
    room_id: string;
    user_id: string;
    joined_at?: string;
}

export interface ChatUser {
    id_usuario: number;
    nombre_usuario: string;
    chat_id: string;
}

export interface PrivateChatRequest {
    id: number;
    from_user_id: string;
    from_user_name: string;
    to_user_id: string;
    to_user_name: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    created_at?: string;
    room_id?: string | null;
}
