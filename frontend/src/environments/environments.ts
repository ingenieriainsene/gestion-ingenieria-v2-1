export const environment = {
  production: false,
  apiUrl: '/api', // Proxy configurado en proxy.conf.json
  supabase: {
    url: 'http://127.0.0.1:54321',      // Tu Supabase "Project URL"
    key: 'sb_publishable_ACJWlz...'     // Tu "anon key" (cópiala del log de inicio)
  }
};