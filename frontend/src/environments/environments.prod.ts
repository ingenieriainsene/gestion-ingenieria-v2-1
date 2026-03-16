export const environment = {
    production: true,

    // Conexión directa a la URL Pública de Railway.
    // Evitamos el proxy Nginx estático para no sufrir problemas de inyección de variables.
    apiUrl: 'https://gestion-ingenieria-v2-production.up.railway.app/api',

    supabase: {
        // URL de tu proyecto de Supabase en la nube
        url: 'https://ftgrjkmkqrzcpggpnnry.supabase.co',

        // REEMPLAZA ESTO: Pon aquí tu "Clave anónima" larga que copiaste de Supabase.
        // (Asegúrate de NO usar la clave local que tenías antes).
        key: 'TU_CLAVE_ANONIMA_AQUI'
    }
};