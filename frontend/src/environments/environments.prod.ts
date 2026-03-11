export const environment = {
    production: true,

    // En producción (Railway), apuntamos directamente al backend público.
    // Dominio backend: gestion-ingenieria-v2-production.up.railway.app (puerto 8082)
    apiUrl: 'https://gestion-ingenieria-v2-production.up.railway.app/api',

    supabase: {
        // URL de tu proyecto de Supabase en la nube
        url: 'https://ftgrjkmkqrzcpggpnnry.supabase.co',

        // REEMPLAZA ESTO: Pon aquí tu "Clave anónima" larga que copiaste de Supabase.
        // (Asegúrate de NO usar la clave local que tenías antes).
        key: 'TU_CLAVE_ANONIMA_AQUI'
    }
};