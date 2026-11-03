
// ============================================
// EL CRITERIO - PANEL EDITORIAL
// Archivo: public/js/admin.js
// ============================================

const adminDB = window.supabaseClient;

let currentUser = null;
let articles = [];
let editingArticleId = null;

const imageBucket = "noticias";

// Elementos del DOM.
const articleForm = document.getElementById("articleForm");
const articleList = document.getElementById("articleList");
const adminMessage = document.getElementById("adminMessage");

// Mensajes del panel.
function showAdminMessage(message, type = "success") {
    if (!adminMessage) return;

    adminMessage.textContent = message;
    adminMessage.className = `admin-message ${type}`;

    window.setTimeout(() => {
        adminMessage.className = "admin-message";
        adminMessage.textContent = "";
    }, 5000);
}

// Crear slug desde el título.
function createSlug(title) {
    const base = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return `${base}-${Date.now().toString(36)}`;
}

// Escapar texto para mostrarlo en HTML.
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// Formatear fecha.
function formatDate(date) {
    if (!date) return "Sin fecha";

    return new Date(date).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

// Obtener URL de la fotografía.
async function uploadImage(file) {
    if (!file) return null;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error("Formato de imagen no permitido.");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("La imagen no debe superar los 5 MB.");
    }

    const extension = file.type.split("/")[1];
    const fileName = `${crypto.randomUUID()}.${extension}`;

    const { error } = await adminDB.storage
        .from(imageBucket)
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
        });

    if (error) throw error;

    const { data } = adminDB.storage
        .from(imageBucket)
        .getPublicUrl(fileName);

    return data.publicUrl;
}

// Obtener las publicaciones según el rol.
async function loadArticles() {
    const isJournalist = currentUser.profile.role === "periodista";

    let query = adminDB
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

    if (isJournalist) {
        query = query.eq("author_id", currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
        showAdminMessage(
            "No se pudieron cargar las publicaciones: " + error.message,
            "error"
        );
        return;
    }

    articles = data || [];

    renderArticles();
    updateStatistics();
}

// Mostrar publicaciones.
function renderArticles() {
    if (!articleList) return;

    if (articles.length === 0) {
        articleList.innerHTML = `
            <p class="empty-message">
                Todavía no tienes publicaciones.
            </p>
        `;
        return;
    }

    articleList.innerHTML = articles.map(article => {
        const isPublished = article.status === "publicado";

        return `
            <div class="article-item">
                <h3>${escapeHTML(article.title)}</h3>

                <div class="article-meta">
                    ${escapeHTML(article.category || "Sin categoría")}
                    · ${formatDate(article.created_at)}
                    · ${escapeHTML(article.status)}
                </div>

                <div class="article-actions">

                    <button
                        type="button"
                        class="edit-button"
                        data-action="edit"
                        data-id="${escapeHTML(article.id)}"
                    >
                        Editar
                    </button>

                    ${
                        isPublished && article.slug
                        ? `<a
                            href="/noticia/${encodeURIComponent(article.slug)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            style="font-size:12px;padding:7px 10px;color:#166534;"
                        >Ver noticia</a>`
                        : ""
                    }

                    <button
                        type="button"
                        class="delete-button"
                        data-action="delete"
                        data-id="${escapeHTML(article.id)}"
                    >
                        Eliminar
                    </button>

                </div>
            </div>
        `;
    }).join("");
}

// Estadísticas.
function updateStatistics() {
    const total = articles.length;

    const published = articles.filter(
        article => article.status === "publicado"
    ).length;

    const drafts = articles.filter(
        article => article.status === "borrador"
    ).length;

    document.getElementById("totalArticles").textContent = total;
    document.getElementById("publishedArticles").textContent = published;
    document.getElementById("draftArticles").textContent = drafts;
}

// Limpiar formulario.
function resetForm() {
    articleForm.reset();

    document.getElementById("articleId").value = "";

    editingArticleId = null;

    document.getElementById("formTitle").textContent = "Nueva noticia";

    document.getElementById("saveArticleButton").textContent =
        "Guardar noticia";

    document.getElementById("cancelEditButton").hidden = true;
}

// Guardar noticia.
async function saveArticle(event) {
    event.preventDefault();

    const button = document.getElementById("saveArticleButton");

    button.disabled = true;
    button.textContent = "Guardando...";

    try {
        const title = document.getElementById("title").value.trim();
        const summary = document.getElementById("summary").value.trim();
        const category = document.getElementById("category").value;
        const content = document.getElementById("content").value.trim();
        const status = document.getElementById("status").value;

        const imageFile = document.getElementById("image").files[0];

        if (!title || !summary || !category || !content) {
            throw new Error("Completa todos los campos obligatorios.");
        }

        if (!["borrador", "publicado"].includes(status)) {
            throw new Error("Estado de publicación no válido.");
        }

        const existingArticle = editingArticleId
            ? articles.find(article => article.id === editingArticleId)
            : null;

        let imageUrl = existingArticle?.image_url || null;

        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }

        const articleData = {
            title,
            summary,
            category,
            content,
            image_url: imageUrl,
            status,
            slug: existingArticle?.slug || createSlug(title),
            author_id: currentUser.id
        };

        if (status === "publicado") {
            articleData.published_at =
                existingArticle?.published_at || new Date().toISOString();
        } else {
            articleData.published_at = null;
        }

        let result;

        if (editingArticleId) {
            result = await adminDB
                .from("articles")
                .update(articleData)
                .eq("id", editingArticleId)
                .select()
                .single();
        } else {
            result = await adminDB
                .from("articles")
                .insert(articleData)
                .select()
                .single();
        }

        if (result.error) throw result.error;

        showAdminMessage(
            editingArticleId
                ? "Noticia actualizada correctamente."
                : "Noticia guardada correctamente."
        );

        resetForm();
        await loadArticles();

    } catch (error) {
        showAdminMessage(
            error.message || "Ocurrió un error al guardar.",
            "error"
        );
    } finally {
        button.disabled = false;
        button.textContent = editingArticleId
            ? "Actualizar noticia"
            : "Guardar noticia";
    }
}

// Cargar una noticia en el formulario para editarla.
function editArticle(id) {
    const article = articles.find(item => item.id === id);

    if (!article) return;

    const role = currentUser.profile.role;

    if (
        role === "periodista" &&
        article.author_id !== currentUser.id
    ) {
        showAdminMessage(
            "No puedes editar noticias de otros periodistas.",
            "error"
        );
        return;
    }

    editingArticleId = article.id;

    document.getElementById("articleId").value = article.id;
    document.getElementById("title").value = article.title || "";
    document.getElementById("summary").value = article.summary || "";
    document.getElementById("category").value = article.category || "";
    document.getElementById("content").value = article.content || "";
    document.getElementById("status").value = article.status || "borrador";

    document.getElementById("formTitle").textContent = "Editar noticia";

    document.getElementById("saveArticleButton").textContent =
        "Actualizar noticia";

    document.getElementById("cancelEditButton").hidden = false;

    document.getElementById("editorPanel").scrollIntoView({
        behavior: "smooth"
    });
}

// Eliminar noticia.
async function deleteArticle(id) {
    const article = articles.find(item => item.id === id);

    if (!article) return;

    if (!confirm(`¿Deseas eliminar la noticia "${article.title}"?`)) {
        return;
    }

    const { error } = await adminDB
        .from("articles")
        .delete()
        .eq("id", id);

    if (error) {
        showAdminMessage(
            "No se pudo eliminar la noticia: " + error.message,
            "error"
        );
        return;
    }

    showAdminMessage("Noticia eliminada correctamente.");

    if (editingArticleId === id) {
        resetForm();
    }

    await loadArticles();
}

// Delegar botones del listado.
function setupArticleActions() {
    articleList.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const id = button.dataset.id;

        if (button.dataset.action === "edit") {
            editArticle(id);
        }

        if (button.dataset.action === "delete") {
            deleteArticle(id);
        }
    });
}

// Inicio del panel.
document.addEventListener("DOMContentLoaded", async () => {
    if (!articleForm || !articleList) return;

    currentUser = await protectAdminPage();

    if (!currentUser) return;

    const role = currentUser.profile.role;

    // Los periodistas no pueden publicar directamente.
    if (role === "periodista") {
        const statusSelect = document.getElementById("status");

        statusSelect.value = "borrador";

        const publishedOption = statusSelect.querySelector(
            'option[value="publicado"]'
        );

        publishedOption.disabled = true;
    }

    articleForm.addEventListener("submit", saveArticle);

    document.getElementById("cancelEditButton")
        .addEventListener("click", resetForm);

    document.getElementById("refreshArticlesButton")
        .addEventListener("click", loadArticles);

    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

    setupArticleActions();

    await loadArticles();
});
