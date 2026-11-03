
// ============================================
// EL CRITERIO - AUTENTICACIÓN
// Archivo: public/js/auth.js
// ============================================

const authClient = window.supabaseClient;

if (!authClient) {
    throw new Error("No se encontró la conexión con Supabase.");
}

const ROLES = ["administrador", "editor", "periodista"];

// Obtener usuario y su perfil.
async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await authClient.auth.getUser();

    if (error || !user) {
        return null;
    }

    const { data: profile, error: profileError } = await authClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single();

    if (profileError || !profile || !ROLES.includes(profile.role)) {
        return null;
    }

    return {
        ...user,
        profile
    };
}

// Mostrar mensajes.
function showLoginMessage(message, type = "error") {
    const element = document.getElementById("loginMessage");

    if (!element) return;

    element.textContent = message;
    element.className = `login-message ${type}`;
}

// Iniciar sesión.
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const button = document.getElementById("loginButton");

    button.disabled = true;
    button.textContent = "Verificando...";

    try {
        const { data, error } = await authClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        const { data: profile, error: profileError } = await authClient
            .from("profiles")
            .select("id, full_name, role")
            .eq("id", data.user.id)
            .single();

        if (
            profileError ||
            !profile ||
            !ROLES.includes(profile.role)
        ) {
            await authClient.auth.signOut();

            throw new Error(
                "Tu cuenta no tiene un perfil editorial válido. Contacta con el administrador."
            );
        }

        showLoginMessage("Acceso correcto. Redirigiendo...", "success");

        window.location.replace("/admin");

    } catch (error) {
        showLoginMessage(
            error.message || "No se pudo iniciar sesión."
        );

        button.disabled = false;
        button.textContent = "Iniciar sesión";
    }
}

// Proteger el panel editorial.
async function protectAdminPage() {
    const user = await getCurrentUser();

    if (!user) {
        await authClient.auth.signOut();
        window.location.replace("/login");
        return null;
    }

    const emailElement = document.getElementById("userEmail");
    const roleElement = document.getElementById("userRole");

    if (emailElement) {
        emailElement.textContent = user.email;
    }

    if (roleElement) {
        roleElement.textContent = user.profile.role.toUpperCase();
    }

    return user;
}

// Cerrar sesión.
async function logout() {
    const { error } = await authClient.auth.signOut();

    if (error) {
        alert("No se pudo cerrar la sesión.");
        return;
    }

    window.location.replace("/login");
}

// Mostrar u ocultar contraseña.
function setupPasswordToggle() {
    const password = document.getElementById("password");
    const toggle = document.getElementById("togglePassword");

    if (!password || !toggle) return;

    toggle.addEventListener("click", () => {
        const isPassword = password.type === "password";

        password.type = isPassword ? "text" : "password";
        toggle.textContent = isPassword ? "Ocultar" : "Mostrar";
    });
}

// Inicialización.
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const logoutButton = document.getElementById("logoutButton");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);

        setupPasswordToggle();

        const year = document.getElementById("currentYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }

        // Si ya inició sesión, evitar mostrar el formulario.
        authClient.auth.getSession().then(async ({ data }) => {
            if (data.session) {
                const user = await getCurrentUser();

                if (user) {
                    window.location.replace("/admin");
                }
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
});
