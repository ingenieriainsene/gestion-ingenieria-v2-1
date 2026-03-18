export const environment = {
    production: true,

    // Usamos el proxy de Nginx para comunicación interna y evitar CORS.
    apiUrl: 'https://gestion-ingenieria-v2.onrender.com',

    supabase: {
        // URL de tu proyecto de Supabase en la nube
        url: 'https://ftgrjkmkqrzcpggpnnry.supabase.co',

        // REEMPLAZA ESTO: Pon aquí tu "Clave anónima" larga que copiaste de Supabase.
        // (Asegúrate de NO usar la clave local que tenías antes).
        key: 'TU_CLAVE_ANONIMA_AQUI'
    }
};