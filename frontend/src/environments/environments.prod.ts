export const environment = {
    production: true,

    // En producción, nginx hace proxy de /api al backend para evitar CORS y problemas de DNS.
    apiUrl: '/api',

    supabase: {
        // URL de tu proyecto de Supabase en la nube
        url: 'https://ftgrjkmkqrzcpggpnnry.supabase.co',

        // REEMPLAZA ESTO: Pon aquí tu "Clave anónima" larga que copiaste de Supabase.
        // (Asegúrate de NO usar la clave local que tenías antes).
        key: 'TU_CLAVE_ANONIMA_AQUI'
    }
};