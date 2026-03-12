export const environment = {
    production: true,

    // En producción (Railway), usamos una ruta relativa para que las llamadas
    // pasen por el proxy Nginx del mismo contenedor (evita CORS por completo).
    // Nginx reenvía /api/ → backend interno (gestion-ingenieria-v2.railway.internal:8080)
    apiUrl: '/api',

    supabase: {
        // URL de tu proyecto de Supabase en la nube
        url: 'https://ftgrjkmkqrzcpggpnnry.supabase.co',

        // REEMPLAZA ESTO: Pon aquí tu "Clave anónima" larga que copiaste de Supabase.
        // (Asegúrate de NO usar la clave local que tenías antes).
        key: 'TU_CLAVE_ANONIMA_AQUI'
    }
};