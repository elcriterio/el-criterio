
// ============================================
// EL CRITERIO - LECTURA DE NOTICIAS
// Archivo: public/js/article.js
// ============================================

const articleDB = window.supabaseClient;

// Escapar texto para evitar insertar HTML no confiable.
function escapeArticleHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// Obtener slug de la URL.
function getArticleSlug() {
    const parts = window.location.pathname.split("/").filter(Boolean);

    return parts.length >= 2 && parts[0] === "noticia"
        ? decodeURIComponent(parts[1])
        : null;
}

// Formatear fecha.
function formatArticleDate(date) {
    if (!date) return "Fecha no disponible";

    return new Date(date).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// Mostrar contenido como párrafos de texto.
// No interpreta etiquetas HTML guardadas en la base de datos.
function formatArticleContent(content) {
    return String(content || "")
        .split(/\n\s*\n/)
        .map(paragraph => paragraph.trim())
        .filter(Boolean)
        .map(paragraph => `<p>${escapeArticleHTML(paragraph).replace(/\n/g, "<br>")}</p>`)
        .join("");
}

// Mostrar error.
function showArticleError() {
    document.getElementById("articleLoading").hidden = true;
    document.getElementById("articleContent").hidden = true;
    document.getElementById("articleError").hidden = false;
}

// Obtener autor.
async function getArticleAuthor(article) {
    // Primero utilizamos el autor seleccionado al publicar.
    if (article.author_name && article.author_name.trim()) {
        return article.author_name.trim();
    }

    // Compatibilidad con noticias antiguas.
    if (!article.author_id) {
        return "Redacción EL CRITERIO";
    }

    const { data, error } = await articleDB
        .from("profiles")
        .select("full_name")
        .eq("id", article.author_id)
        .maybeSingle();

    if (error || !data || !data.full_name) {
        return "Redacción EL CRITERIO";
    }

    return data.full_name;
}

// Mostrar datos de la noticia.
async function renderArticle(article) {
    const author = await getArticleAuthor(article);

    document.title = `${article.title} | EL CRITERIO`;

    document.getElementById("articleCategory").textContent =
        article.category || "Actualidad";

    document.getElementById("articleTitle").textContent =
        article.title;

    document.getElementById("articleSummary").textContent =
        article.summary || "";

    document.getElementById("articleAuthor").textContent = author;

    document.getElementById("articleDate").textContent =
        formatArticleDate(article.published_at || article.created_at);

    document.getElementById("breadcrumbCategory").textContent =
        article.category || "Noticias";

    document.getElementById("breadcrumbTitle").textContent =
        article.title;

    document.getElementById("articleBody").innerHTML =
        formatArticleContent(article.content);

    // Fotografía principal.
    const figure = document.getElementById("articleFigure");
    const image = document.getElementById("articleImage");

    if (article.image_url) {
        image.src = article.image_url;
        image.alt = article.title;
        figure.hidden = false;

        document.getElementById("imageCaption").textContent =
            `Fotografía: EL CRITERIO`;
    } else {
        figure.hidden = true;
        image.removeAttribute("src");
    }

    // Compartir noticia.
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(article.title);

    document.getElementById("whatsappShare").href =
        `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;

    document.getElementById("facebookShare").href =
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    document.getElementById("copyLinkButton")
        .addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(currentUrl);

                const button = document.getElementById("copyLinkButton");
                button.textContent = "¡Enlace copiado!";

                setTimeout(() => {
                    button.textContent = "Copiar enlace";
                }, 2000);

            } catch {
                alert("No se pudo copiar el enlace.");
            }
        });

    document.getElementById("articleLoading").hidden = true;
    document.getElementById("articleError").hidden = true;
    document.getElementById("articleContent").hidden = false;
}

// Cargar noticias relacionadas.
async function loadRelatedArticles(article) {
    const container = document.getElementById("relatedArticles");

    const { data, error } = await articleDB
        .from("articles")
        .select("title, slug, category")
        .eq("status", "publicado")
        .eq("category", article.category)
        .neq("id", article.id)
        .order("published_at", { ascending: false })
        .limit(5);

    if (error || !data || data.length === 0) {
        container.innerHTML = `
            <p class="loading-message">
                No hay noticias relacionadas disponibles.
            </p>
        `;
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="related-item">

            <span class="related-category">
                ${escapeArticleHTML(item.category || "Noticias")}
            </span>

            <a href="/noticia/${encodeURIComponent(item.slug)}">
                ${escapeArticleHTML(item.title)}
            </a>

        </div>
    `).join("");
}

// Cargar noticia por slug.
async function loadArticle() {
    if (!articleDB) {
        showArticleError();
        return;
    }

    const slug = getArticleSlug();

    if (!slug) {
        showArticleError();
        return;
    }

    const { data: article, error } = await articleDB
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "publicado")
        .maybeSingle();

    if (error || !article) {
        showArticleError();
        return;
    }

    await renderArticle(article);
    await loadRelatedArticles(article);
}

// Fecha y año.
document.addEventListener("DOMContentLoaded", () => {
    const currentDate = document.getElementById("currentDate");
    const currentYear = document.getElementById("currentYear");

    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    loadArticle();
});
