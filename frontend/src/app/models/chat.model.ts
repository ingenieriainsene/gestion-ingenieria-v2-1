// Modelos para el sistema de chat (Supabase Realtime)

export interface ChatMessage {
    id: string; // UUID
    room_id: string; // UUID
    sender_id: string; // UUID (Supabase User)
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
