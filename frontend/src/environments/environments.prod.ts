export const environment = {
    production: true,
    apiUrl: '/api',

    supabase: {
        // Redirige al puerto de Kong (8000) en el servidor local
        url: 'http://192.168.1.66:8000',

        // REEMPLAZA ESTO: Pon aquí tu "Clave anónima" (anon key) generada localmente.
        key: 'CLAVE_ANONIMA_LOCAL_AQUI'
    }
};