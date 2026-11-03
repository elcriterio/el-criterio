
// ============================================
// EL CRITERIO - PORTADA Y NOTICIAS
// Archivo: public/js/main.js
// ============================================

// Menú de navegación
const menuToggle = document.querySelector("#menu-toggle");
const mainNav = document.querySelector("#main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Fecha y año
const yearElement = document.querySelector("#current-year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const dateElement = document.querySelector("#today-date");
if (dateElement) {
  dateElement.textContent = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

// Elementos de noticias
const leadStory = document.querySelector("#lead-story");
const sideStories = document.querySelector("#side-stories");
const newsGrid = document.querySelector("#news-grid");
const newsMessage = document.querySelector("#news-message");

// Evita insertar contenido HTML no confiable
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

// Formato de fecha
function formatDate(value) {
  if (!value) return "Redacción EL CRITERIO";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Redacción EL CRITERIO";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

// Fotografía o imagen de reserva
function imageHTML(article, className) {
  if (article.image_url) {
    return `
      <div class="image-placeholder ${className}">
        <img
          src="${escapeHTML(article.image_url)}"
          alt="${escapeHTML(article.title)}"
          loading="lazy"
          style="width:100%;height:100%;object-fit:cover;"
        >
      </div>
    `;
  }

  return `
    <div class="image-placeholder ${className}">
      <span>EL CRITERIO</span>
    </div>
  `;
}

// Enlace de cada noticia
function articleURL(article) {
  return `/noticia/${encodeURIComponent(article.slug)}`;
}

// Noticia principal
function renderLead(article) {
  if (!leadStory) return;

  leadStory.innerHTML = `
    <article class="lead-story">
      <a href="${articleURL(article)}" aria-label="${escapeHTML(article.title)}">
        ${imageHTML(article, "lead-image")}
      </a>
      <div class="story-content">
        <span class="category">${escapeHTML(article.category || "ACTUALIDAD")}</span>
        <h1>
          <a href="${articleURL(article)}">${escapeHTML(article.title)}</a>
        </h1>
        <p class="summary">${escapeHTML(article.summary || "")}</p>
        <p class="byline">
          Redacción EL CRITERIO · ${formatDate(article.published_at || article.created_at)}
        </p>
      </div>
    </article>
  `;
}

// Noticias destacadas laterales
function renderSide(article) {
  return `
    <article class="side-story">
      <a href="${articleURL(article)}">
        ${imageHTML(article, "side-image")}
      </a>
      <div>
        <span class="category">${escapeHTML(article.category || "ACTUALIDAD")}</span>
        <h2>
          <a href="${articleURL(article)}">${escapeHTML(article.title)}</a>
        </h2>
        <p class="byline">
          Redacción EL CRITERIO · ${formatDate(article.published_at || article.created_at)}
        </p>
      </div>
    </article>
  `;
}

// Tarjetas de últimas noticias
function renderCard(article) {
  return `
    <article class="news-card">
      <a href="${articleURL(article)}">
        ${imageHTML(article, "card-image")}
      </a>
      <span class="category">${escapeHTML(article.category || "ACTUALIDAD")}</span>
      <h3>
        <a href="${articleURL(article)}">${escapeHTML(article.title)}</a>
      </h3>
      <p>${escapeHTML(article.summary || "")}</p>
      <p class="byline">
        ${formatDate(article.published_at || article.created_at)}
      </p>
    </article>
  `;
}

// Cargar noticias desde Supabase
async function loadHomepageArticles() {
  if (!window.supabaseClient) {
    if (newsMessage) {
      newsMessage.textContent = "No se pudo conectar con el servicio de noticias.";
    }
    console.error("No se encontró window.supabaseClient.");
    return;
  }

  try {
    const { data: articles, error } = await window.supabaseClient
      .from("articles")
      .select("id, title, slug, summary, category, image_url, created_at, published_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!articles || articles.length === 0) {
      if (leadStory) {
        leadStory.innerHTML = `
          <article class="lead-story">
            <div class="story-content">
              <span class="category">EL CRITERIO</span>
              <h1>Próximamente, nuestras noticias</h1>
              <p class="summary">Todavía no hay noticias publicadas.</p>
            </div>
          </article>
        `;
      }

      if (sideStories) sideStories.innerHTML = "";
      if (newsGrid) newsGrid.innerHTML = "";
      if (newsMessage) newsMessage.textContent = "No hay noticias publicadas por el momento.";
      return;
    }

    // Primera noticia: portada
    renderLead(articles[0]);

    // Siguientes tres: destacadas
    if (sideStories) {
      sideStories.innerHTML = articles
        .slice(1, 4)
        .map(renderSide)
        .join("");
    }

    // Noticias restantes: últimas noticias
    if (newsGrid) {
      newsGrid.innerHTML = articles
        .slice(4)
        .map(renderCard)
        .join("");
    }

    if (newsMessage) {
      newsMessage.textContent = "";
    }

  } catch (error) {
    console.error("Error cargando noticias:", error);

    if (newsMessage) {
      newsMessage.textContent = "No se pudieron cargar las noticias. Intenta nuevamente más tarde.";
    }
  }
}

// Ejecutar cuando el documento esté listo
document.addEventListener("DOMContentLoaded", loadHomepageArticles);
