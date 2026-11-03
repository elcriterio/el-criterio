
// ============================================
// EL CRITERIO - CONEXIÓN CON SUPABASE
// Archivo: public/js/supabase.js
// ============================================

const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU_CLAVE_PUBLICA_ANON";

if (!window.supabase) {
    throw new Error(
        "No se ha cargado la librería de Supabase. Revisa el CDN en el HTML."
    );
}

if (
    SUPABASE_URL.includes("TU-PROYECTO") ||
    SUPABASE_ANON_KEY.includes("TU_CLAVE")
) {
    throw new Error(
        "Configura SUPABASE_URL y SUPABASE_ANON_KEY en supabase.js."
    );
}

const { createClient } = window.supabase;

const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

// Disponible para los demás archivos JavaScript.
window.supabaseClient = supabaseClient;
